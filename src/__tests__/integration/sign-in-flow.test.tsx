/**
 * Integration Test — Sign In Flow
 *
 * Critical flow #1: User enters email + password → taps Sign In → auth store updates.
 * Tests validation, error handling, and successful sign-in.
 */
import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "../test-utils";
import { useAuthStore } from "../../stores/authStore";

// Mock the auth store — path relative to project root (jest resolves from there)
const mockSignIn = jest.fn();
jest.mock("../../stores/authStore", () => ({
  useAuthStore: jest.fn(),
}));

const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;

// We need to import after the mock is set up
const getSignInScreen = () => require("../../../app/(auth)/sign-in").default;

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseAuthStore.mockImplementation((selector: (s: any) => any) =>
    selector({
      signIn: mockSignIn,
      session: null,
      profile: null,
      isLoading: false,
      isOnboarded: false,
    })
  );
});

describe("Sign In Flow", () => {
  it("renders the sign-in form with email and password fields", () => {
    const SignInScreen = getSignInScreen();
    const { getByText, getByPlaceholderText } = render(<SignInScreen />);

    expect(getByText("Welcome back")).toBeTruthy();
    expect(getByPlaceholderText("you@example.com")).toBeTruthy();
    expect(getByPlaceholderText("Enter your password")).toBeTruthy();
    expect(getByText("Sign In")).toBeTruthy();
  });

  it("shows validation errors when submitting empty form", async () => {
    const SignInScreen = getSignInScreen();
    const { getByText } = render(<SignInScreen />);

    const signInButton = getByText("Sign In");
    fireEvent.press(signInButton);

    // signIn should NOT have been called (Zod validation blocks it)
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("calls signIn with correct credentials on valid submission", async () => {
    mockSignIn.mockResolvedValueOnce(undefined);
    const SignInScreen = getSignInScreen();
    const { getByText, getByPlaceholderText } = render(<SignInScreen />);

    const emailInput = getByPlaceholderText("you@example.com");
    const passwordInput = getByPlaceholderText("Enter your password");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");

    const signInButton = getByText("Sign In");
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("shows alert on sign-in failure", async () => {
    mockSignIn.mockRejectedValueOnce(new Error("Invalid credentials"));
    const alertSpy = jest.spyOn(Alert, "alert");
    const SignInScreen = getSignInScreen();

    const { getByText, getByPlaceholderText } = render(<SignInScreen />);

    fireEvent.changeText(getByPlaceholderText("you@example.com"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Enter your password"), "password123");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Sign In Failed", "Invalid credentials");
    });

    alertSpy.mockRestore();
  });

  it("has a link to forgot password", () => {
    const SignInScreen = getSignInScreen();
    const { getByText } = render(<SignInScreen />);
    expect(getByText("Forgot password?")).toBeTruthy();
  });

  it("has a link to sign up", () => {
    const SignInScreen = getSignInScreen();
    const { getByText } = render(<SignInScreen />);
    expect(getByText("Sign Up")).toBeTruthy();
  });
});
