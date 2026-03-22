/**
 * Smoke tests — Auth screens
 * Verifies each screen mounts without crashing.
 */
import React from "react";
import { render } from "../test-utils";

// Lazy imports to work with mocks from jest.setup.js
const getWelcome = () => require("../../../app/(auth)/welcome").default;
const getSignIn = () => require("../../../app/(auth)/sign-in").default;
const getSignUp = () => require("../../../app/(auth)/sign-up").default;
const getForgotPassword = () => require("../../../app/(auth)/forgot-password").default;

describe("Auth Screens — Smoke Tests", () => {
  it("renders WelcomeScreen without crashing", () => {
    const Screen = getWelcome();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders SignInScreen without crashing", () => {
    const Screen = getSignIn();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders SignUpScreen without crashing", () => {
    const Screen = getSignUp();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders ForgotPasswordScreen without crashing", () => {
    const Screen = getForgotPassword();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });
});
