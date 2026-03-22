import { create } from "zustand";
import type { Group, Organization, GroupMember } from "../types/database.types";
import { supabase } from "../lib/supabase";
import { generateInviteCode } from "../constants/categories";

interface GroupState {
  groups: Group[];
  organizations: Organization[];
  isLoading: boolean;

  // Actions
  fetchMyGroups: () => Promise<void>;
  fetchMyOrganizations: () => Promise<void>;
  createOrganization: (
    org: Omit<Organization, "id" | "created_at">
  ) => Promise<Organization>;
  createGroup: (
    group: Omit<Group, "id" | "created_at" | "invite_code">
  ) => Promise<Group>;
  joinGroup: (inviteCode: string, profileId: string) => Promise<Group>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  organizations: [],
  isLoading: false,

  fetchMyGroups: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { set({ isLoading: false }); return; }

      // Fetch groups where user is an active member
      const { data: memberGroups, error: memberError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("profile_id", user.id)
        .eq("status", "active");

      if (memberError) throw memberError;

      const groupIds = memberGroups?.map((m) => m.group_id) ?? [];

      // Also fetch groups from user's organizations
      const orgs = get().organizations;
      const orgIds = orgs.map((o) => o.id);

      let allGroups: Group[] = [];

      if (orgIds.length > 0) {
        const { data: orgGroups, error: orgError } = await supabase
          .from("groups")
          .select("*")
          .in("organization_id", orgIds);

        if (orgError) throw orgError;
        allGroups = (orgGroups as Group[]) ?? [];
      }

      if (groupIds.length > 0) {
        const { data: joinedGroups, error: joinedError } = await supabase
          .from("groups")
          .select("*")
          .in("id", groupIds);

        if (joinedError) throw joinedError;

        // Merge and deduplicate
        const existingIds = new Set(allGroups.map((g) => g.id));
        for (const g of joinedGroups ?? []) {
          if (!existingIds.has(g.id)) {
            allGroups.push(g);
          }
        }
      }

      set({ groups: allGroups as Group[] });
    } catch (error) {
      console.error("Fetch groups error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyOrganizations: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ organizations: (data as Organization[]) ?? [] });
    } catch (error) {
      console.error("Fetch organizations error:", error);
    }
  },

  createOrganization: async (org) => {
    const { data, error } = await supabase
      .from("organizations")
      .insert(org)
      .select()
      .single();

    if (error) throw error;
    const newOrg = data as Organization;
    set({ organizations: [newOrg, ...get().organizations] });
    return newOrg;
  },

  createGroup: async (group) => {
    const inviteCode = generateInviteCode();
    const { data, error } = await supabase
      .from("groups")
      .insert({ ...group, invite_code: inviteCode })
      .select()
      .single();

    if (error) throw error;
    const newGroup = data as Group;
    set({ groups: [newGroup, ...get().groups] });
    return newGroup;
  },

  joinGroup: async (inviteCode, profileId) => {
    // Find group by invite code
    const { data: group, error: findError } = await supabase
      .from("groups")
      .select("*")
      .eq("invite_code", inviteCode.toUpperCase())
      .single();

    if (findError || !group) throw new Error("Invalid invite code");

    // Check if already a member
    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("profile_id", profileId)
      .single();

    if (existing) throw new Error("Already a member of this group");

    // Join group
    const { error: joinError } = await supabase.from("group_members").insert({
      group_id: group.id,
      profile_id: profileId,
      child_id: null,
      added_by: profileId,
      role: "member",
      status: "active",
    });

    if (joinError) throw joinError;

    const typedGroup = group as Group;
    set({ groups: [typedGroup, ...get().groups] });
    return typedGroup;
  },
}));
