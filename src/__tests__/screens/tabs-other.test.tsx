/**
 * Smoke tests — Schedule, Discover, Notifications screens
 */
import React from "react";
import { render } from "../test-utils";

const getSchedule = () => require("../../../app/(tabs)/schedule/index").default;
const getDiscover = () => require("../../../app/(tabs)/discover/index").default;
const getNotifications = () => require("../../../app/(tabs)/notifications/index").default;

describe("Schedule, Discover, Notifications — Smoke Tests", () => {
  it("renders ScheduleScreen without crashing", () => {
    const Screen = getSchedule();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders DiscoverScreen without crashing", () => {
    const Screen = getDiscover();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders NotificationsScreen without crashing", () => {
    const Screen = getNotifications();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });
});
