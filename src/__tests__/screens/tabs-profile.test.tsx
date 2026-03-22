/**
 * Smoke tests — Profile screens
 */
import React from "react";
import { render } from "../test-utils";

const getProfile = () => require("../../../app/(tabs)/profile/index").default;
const getSettings = () => require("../../../app/(tabs)/profile/settings").default;
const getAccount = () => require("../../../app/(tabs)/profile/account").default;
const getAppearance = () => require("../../../app/(tabs)/profile/appearance").default;
const getSecurity = () => require("../../../app/(tabs)/profile/security").default;
const getNotifications = () => require("../../../app/(tabs)/profile/notifications").default;
const getEmergencyContact = () => require("../../../app/(tabs)/profile/emergency-contact").default;
const getFamily = () => require("../../../app/(tabs)/profile/family").default;
const getSwitchRole = () => require("../../../app/(tabs)/profile/switch-role").default;
const getOrganizerPrefs = () => require("../../../app/(tabs)/profile/organizer-prefs").default;
const getDataExport = () => require("../../../app/(tabs)/profile/data-export").default;
const getDeleteAccount = () => require("../../../app/(tabs)/profile/delete-account").default;

describe("Profile Screens — Smoke Tests", () => {
  it("renders ProfileScreen without crashing", () => {
    const Screen = getProfile();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders ProfileSettingsScreen without crashing", () => {
    const Screen = getSettings();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders ProfileAccountScreen without crashing", () => {
    const Screen = getAccount();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders ProfileAppearanceScreen without crashing", () => {
    const Screen = getAppearance();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders ProfileSecurityScreen without crashing", () => {
    const Screen = getSecurity();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders ProfileNotificationsScreen without crashing", () => {
    const Screen = getNotifications();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders ProfileEmergencyContactScreen without crashing", () => {
    const Screen = getEmergencyContact();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders ProfileFamilyScreen without crashing", () => {
    const Screen = getFamily();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders ProfileSwitchRoleScreen without crashing", () => {
    const Screen = getSwitchRole();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders ProfileOrganizerPrefsScreen without crashing", () => {
    const Screen = getOrganizerPrefs();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders ProfileDataExportScreen without crashing", () => {
    const Screen = getDataExport();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders ProfileDeleteAccountScreen without crashing", () => {
    const Screen = getDeleteAccount();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });
});
