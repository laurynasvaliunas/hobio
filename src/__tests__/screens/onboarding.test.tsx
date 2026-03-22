/**
 * Smoke tests — Onboarding screens
 */
import React from "react";
import { render } from "../test-utils";

const getSelectRole = () => require("../../../app/(onboarding)/select-role").default;
const getOrganizerSetup = () => require("../../../app/(onboarding)/organizer-setup").default;
const getFamilySetup = () => require("../../../app/(onboarding)/family-setup").default;

describe("Onboarding Screens — Smoke Tests", () => {
  it("renders SelectRoleScreen without crashing", () => {
    const Screen = getSelectRole();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders OrganizerSetupScreen without crashing", () => {
    const Screen = getOrganizerSetup();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders FamilySetupScreen without crashing", () => {
    const Screen = getFamilySetup();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });
});
