import { useState, useCallback } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { useStripe } from "@stripe/stripe-react-native";
import { supabase } from "../lib/supabase";
import { createLogger } from "../lib/logger";

const log = createLogger("usePaymentSheet");

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
 *  1. Call `createPaymentIntent(params)` — fetches a PaymentIntent from the
 *     backend Edge Function and initialises the Stripe Payment Sheet.
 *  2. Call `presentPaymentSheet()` — opens the native Stripe UI.
 *     Only available after step 1 succeeds (`paymentReady === true`).
 *
 * In Expo Go the Stripe native module is absent; a dev-mode alert is shown
 * **but success is NOT faked** — callers receive `success: false` so no
 * client-side invoice is recorded without a real payment.
 */
export function usePaymentSheet() {
  const { initPaymentSheet, presentPaymentSheet: stripePresent } = useStripe();

  const [isLoading, setIsLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  /**
   * Step 1: Request a payment intent from the backend and initialise the
   * Stripe Payment Sheet so it is ready to present.
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
      setPaymentReady(false);
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

        // Initialise the native Payment Sheet BEFORE presenting it.
        // Skipping this step causes presentPaymentSheet to throw in production.
        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: data.paymentIntent,
          customerEphemeralKeySecret: data.ephemeralKey,
          customerId: data.customer,
          merchantDisplayName: "Hobio",
          returnURL: "hobio://payment-return",
          defaultBillingDetails: {},
        });

        if (initError) throw new Error(initError.message);

        setPaymentReady(true);
        return data;
      } catch (err) {
        log.error("Create payment intent failed", { name: (err as Error)?.name });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [initPaymentSheet],
  );

  /**
   * Step 2: Present the Stripe Payment Sheet (native UI).
   * Must be called after `createPaymentIntent` completes successfully.
   */
  const presentPaymentSheet = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!paymentReady) {
      return { success: false, error: "No payment intent. Call createPaymentIntent first." };
    }

    // stripePresent may be undefined when the native Stripe module is not
    // available (Expo Go). We guard here rather than crashing.
    if (!stripePresent) {
      Alert.alert(
        "Payment (Dev Mode)",
        "Stripe is not available in Expo Go. Use a production build to process real payments.",
        [{ text: "OK" }],
      );
      // Return false — do NOT simulate success, so no invoice is recorded.
      return { success: false, error: "Stripe not available in Expo Go" };
    }

    setIsLoading(true);
    try {
      const { error } = await stripePresent();

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
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
      setPaymentReady(false);
    }
  }, [paymentReady, stripePresent]);

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
   * Record a confirmed payment in the invoices table.
   * Only call this after `presentPaymentSheet` returns `{ success: true }`.
   * The status "paid" here represents the client acknowledging the Stripe
   * success — a server-side webhook should be the authoritative confirmation.
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
        status: "pending_confirmation", // Stripe webhook will flip this to "paid"
        paid_at: null,
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
