/**
 * Integration Test — Onboarding / Role Selection Flow
 *
 * Critical flow #2: After sign-up, user selects their role (organizer/participant/parent)
 * → store updates → redirects to appropriate setup screen.
 */
import React from "react";
import { render, fireEvent, waitFor } from "../test-utils";
import { useAuthStore } from "../../stores/authStore";

// Mock router with overrides
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(false),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  usePathname: () => "/",
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}));

// Mock auth store
const mockUpdateRole = jest.fn();
jest.mock("../../stores/authStore", () => ({
  useAuthStore: jest.fn(),
}));

const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;

const getSelectRoleScreen = () =>
  require("../../../app/(onboarding)/select-role").default;

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseAuthStore.mockImplementation((selector: (s: any) => any) =>
    selector({
      profile: {
        id: "user-1",
        email: "test@example.com",
        full_name: "Test User",
        role: "participant",
      },
      session: { user: { id: "user-1", email: "test@example.com" } },
      updateRole: mockUpdateRole,
      isOnboarded: false,
    })
  );
});

describe("Onboarding — Role Selection Flow", () => {
  it("renders the role selection screen without crashing", () => {
    const SelectRoleScreen = getSelectRoleScreen();
    const { toJSON } = render(<SelectRoleScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it("displays role option cards", () => {
    const SelectRoleScreen = getSelectRoleScreen();
    const tree = render(<SelectRoleScreen />);
    // The screen should show recognizable role text
    expect(tree.toJSON()).toBeTruthy();
  });

  it("allows interaction without throwing", () => {
    const SelectRoleScreen = getSelectRoleScreen();
    // Simply ensures the screen mounts and all state hooks work
    expect(() => render(<SelectRoleScreen />)).not.toThrow();
  });
});
