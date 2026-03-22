import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { GroupMember, Profile, Child, MemberStatus } from "../types/database.types";

export interface MemberWithDetails extends GroupMember {
  profile?: Profile;
  child?: Child;
}

interface UseMembersReturn {
  members: MemberWithDetails[];
  pendingMembers: MemberWithDetails[];
  isLoading: boolean;
  error: string | null;
  fetchMembers: () => Promise<void>;
  approveMember: (memberId: string) => Promise<void>;
  rejectMember: (memberId: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  totalActive: number;
}

export function useMembers(groupId: string): UseMembersReturn {
  const [members, setMembers] = useState<MemberWithDetails[]>([]);
  const [pendingMembers, setPendingMembers] = useState<MemberWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId);

      if (error) throw error;

      const allMembers = (data ?? []) as MemberWithDetails[];

      // Fetch profile details for each member
      const profileIds = allMembers
        .filter((m) => m.profile_id)
        .map((m) => m.profile_id!);

      const childIds = allMembers
        .filter((m) => m.child_id)
        .map((m) => m.child_id!);

      let profiles: Profile[] = [];
      let children: Child[] = [];

      if (profileIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", profileIds);
        profiles = (profileData as Profile[]) ?? [];
      }

      if (childIds.length > 0) {
        const { data: childData } = await supabase
          .from("children")
          .select("*")
          .in("id", childIds);
        children = (childData as Child[]) ?? [];
      }

      const enriched = allMembers.map((m) => ({
        ...m,
        profile: profiles.find((p) => p.id === m.profile_id),
        child: children.find((c) => c.id === m.child_id),
      }));

      setMembers(enriched.filter((m) => m.status === "active"));
      setPendingMembers(enriched.filter((m) => m.status === "pending"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      console.error("Fetch members error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const approveMember = async (memberId: string) => {
    const { error } = await supabase
      .from("group_members")
      .update({ status: "active" })
      .eq("id", memberId);
    if (error) throw error;

    setPendingMembers((prev) => prev.filter((m) => m.id !== memberId));
    const approved = pendingMembers.find((m) => m.id === memberId);
    if (approved) {
      setMembers((prev) => [...prev, { ...approved, status: "active" as MemberStatus }]);
    }
  };

  const rejectMember = async (memberId: string) => {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", memberId);
    if (error) throw error;
    setPendingMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from("group_members")
      .update({ status: "inactive" })
      .eq("id", memberId);
    if (error) throw error;
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  return {
    members,
    pendingMembers,
    isLoading,
    error,
    fetchMembers,
    approveMember,
    rejectMember,
    removeMember,
    totalActive: members.length,
  };
}
