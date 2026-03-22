import { useState, useCallback } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "../lib/supabase";

/**
 * Payment intent response from our Supabase Edge Function.
 */
interface PaymentIntentResponse {
  paymentIntent: string;
  ephemeralKey: string;
  customer: string;
  publishableKey: string;
}

/**
 * Hook for managing Stripe Payment Sheet interactions.
 *
 * Flow:
 *  1. Call `createPaymentIntent(groupId, memberId)` to get the intent from the backend.
 *  2. The hook initializes the Stripe Payment Sheet.
 *  3. Call `presentPaymentSheet()` to open the native Stripe UI.
 *
 * Note: In production, the backend Edge Function creates the PaymentIntent via
 * the Stripe API and returns the client secret. For development, this hook
 * provides a mock flow that can be swapped out.
 */
export function usePaymentSheet() {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  /**
   * Step 1: Request a payment intent from the backend.
   */
  const createPaymentIntent = useCallback(
    async (params: {
      groupId: string;
      memberId: string;
      amount: number;
      currency: string;
      description?: string;
    }) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke<PaymentIntentResponse>(
          "create-payment-intent",
          {
            body: {
              group_id: params.groupId,
              member_id: params.memberId,
              amount: Math.round(params.amount * 100), // Convert to cents
              currency: params.currency.toLowerCase(),
              description: params.description ?? "Hobio Group Subscription",
            },
          },
        );

        if (error) throw error;
        if (!data) throw new Error("No payment data returned");

        setClientSecret(data.paymentIntent);
        setPaymentReady(true);

        return data;
      } catch (err) {
        console.error("Create payment intent error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Step 2: Present the Stripe Payment Sheet (native UI).
   *
   * This attempts to use @stripe/stripe-react-native's `presentPaymentSheet`.
   * Falls back gracefully in Expo Go where native modules aren't available.
   */
  const presentPaymentSheet = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!clientSecret) {
      return { success: false, error: "No payment intent. Call createPaymentIntent first." };
    }

    setIsLoading(true);
    try {
      // Dynamically import to avoid crashes in Expo Go
      const Stripe = await import("@stripe/stripe-react-native");

      if (!Stripe.presentPaymentSheet) {
        // Stripe native module not available (Expo Go)
        throw new Error("STRIPE_NOT_AVAILABLE");
      }

      const { error } = await Stripe.presentPaymentSheet();

      if (error) {
        if (error.code === "Canceled") {
          return { success: false, error: "Payment cancelled" };
        }
        return { success: false, error: error.message };
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed";

      if (msg === "STRIPE_NOT_AVAILABLE") {
        // In Expo Go — show a mock success for development
        Alert.alert(
          "Payment (Dev Mode)",
          "Stripe is not available in Expo Go. In a production build, the native Payment Sheet would appear here.\n\nSimulating successful payment...",
          [{ text: "OK" }],
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true };
      }

      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
      setPaymentReady(false);
      setClientSecret(null);
    }
  }, [clientSecret]);

  /**
   * Convenience: Create intent + present sheet in one call.
   */
  const checkout = useCallback(
    async (params: {
      groupId: string;
      memberId: string;
      amount: number;
      currency: string;
      description?: string;
    }) => {
      try {
        await createPaymentIntent(params);
        return await presentPaymentSheet();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Checkout failed";
        return { success: false, error: msg };
      }
    },
    [createPaymentIntent, presentPaymentSheet],
  );

  /**
   * Record a successful payment in our invoices table.
   */
  const recordPayment = useCallback(
    async (params: {
      groupId: string;
      memberId: string;
      profileId: string;
      childId?: string | null;
      amount: number;
      currency: string;
      billingPeriod: string;
    }) => {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error } = await supabase.from("invoices").insert({
        group_id: params.groupId,
        member_id: params.memberId,
        profile_id: params.profileId,
        child_id: params.childId ?? null,
        amount: params.amount,
        currency: params.currency,
        billing_period: params.billingPeriod,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        status: "paid",
        paid_at: now.toISOString(),
        paid_marked_by: params.profileId,
      });

      if (error) throw error;
    },
    [],
  );

  return {
    isLoading,
    paymentReady,
    createPaymentIntent,
    presentPaymentSheet,
    checkout,
    recordPayment,
  };
}
