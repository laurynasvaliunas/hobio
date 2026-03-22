/**
 * Smoke tests — Home & Dashboard screens
 */
import React from "react";
import { render } from "../test-utils";

const getHome = () => require("../../../app/(tabs)/home/index").default;
const getDashboard = () => require("../../../app/(tabs)/dashboard/index").default;
const getDashboardPayments = () => require("../../../app/(tabs)/dashboard/payments").default;

describe("Home & Dashboard Screens — Smoke Tests", () => {
  it("renders HomeScreen without crashing", () => {
    const Screen = getHome();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders DashboardScreen without crashing", () => {
    const Screen = getDashboard();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders DashboardPaymentsScreen without crashing", () => {
    const Screen = getDashboardPayments();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });
});
