/**
 * Smoke tests — Groups screens
 */
import React from "react";
import { render } from "../test-utils";

// Override the default router mock to provide groupId param
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(false),
    setParams: jest.fn(),
  }),
  useLocalSearchParams: () => ({ groupId: "test-group-id", sessionId: "test-session-id" }),
  useSegments: () => [],
  usePathname: () => "/",
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}));

const getGroupsList = () => require("../../../app/(tabs)/groups/index").default;
const getGroupDetail = () => require("../../../app/(tabs)/groups/[groupId]/index").default;
const getGroupMembers = () => require("../../../app/(tabs)/groups/[groupId]/members").default;
const getGroupSessions = () => require("../../../app/(tabs)/groups/[groupId]/sessions").default;
const getGroupDocuments = () => require("../../../app/(tabs)/groups/[groupId]/documents").default;
const getGroupInvoices = () => require("../../../app/(tabs)/groups/[groupId]/invoices").default;
const getGroupPayments = () => require("../../../app/(tabs)/groups/[groupId]/payments").default;
const getGroupScheduleSetup = () => require("../../../app/(tabs)/groups/[groupId]/schedule-setup").default;

describe("Groups Screens — Smoke Tests", () => {
  it("renders GroupsListScreen without crashing", () => {
    const Screen = getGroupsList();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders GroupDetailScreen without crashing", () => {
    const Screen = getGroupDetail();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders GroupMembersScreen without crashing", () => {
    const Screen = getGroupMembers();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders GroupSessionsScreen without crashing", () => {
    const Screen = getGroupSessions();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders GroupDocumentsScreen without crashing", () => {
    const Screen = getGroupDocuments();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders GroupInvoicesScreen without crashing", () => {
    const Screen = getGroupInvoices();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders GroupPaymentsScreen without crashing", () => {
    const Screen = getGroupPayments();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders GroupScheduleSetupScreen without crashing", () => {
    const Screen = getGroupScheduleSetup();
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });
});
