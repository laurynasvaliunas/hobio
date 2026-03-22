/**
 * Smoke tests — Modal screens & Join flow
 */
import React from "react";
import { render } from "../test-utils";

// Override router mock for join screen with code param
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(false),
    setParams: jest.fn(),
  }),
  useLocalSearchParams: () => ({ code: "ABC123" }),
  useSegments: () => [],
  usePathname: () => "/",
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}));

const getCreateGroup = () => require("../../../app/modals/create-group").default;
const getAddChild = () => require("../../../app/modals/add-child").default;
const getCreateAnnouncement = () => require("../../../app/modals/create-announcement").default;
const getJoin = () => require("../../../app/join/[code]").default;

describe("Modals & Join — Smoke Tests", () => {
  it("renders CreateGroupModal without crashing", () => {
    const Screen = getCreateGroup();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders AddChildModal without crashing", () => {
    const Screen = getAddChild();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders CreateAnnouncementModal without crashing", () => {
    const Screen = getCreateAnnouncement();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders JoinScreen without crashing", () => {
    const Screen = getJoin();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });
});
