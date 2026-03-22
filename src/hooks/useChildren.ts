import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Child } from "../types/database.types";

interface UseChildrenReturn {
  children: Child[];
  selectedChild: Child | null;
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => void;
  isLoading: boolean;
  fetchChildren: () => Promise<void>;
  addChild: (child: {
    full_name: string;
    date_of_birth: string;
    medical_notes?: string;
  }) => Promise<Child>;
  updateChild: (childId: string, updates: Partial<Child>) => Promise<void>;
  removeChild: (childId: string) => Promise<void>;
}

export function useChildren(parentId: string): UseChildrenReturn {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChildren = useCallback(async () => {
    if (!parentId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("parent_id", parentId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setChildren((data as Child[]) ?? []);
    } catch (error) {
      console.error("Fetch children error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const addChild = async (child: {
    full_name: string;
    date_of_birth: string;
    medical_notes?: string;
  }) => {
    const { data, error } = await supabase
      .from("children")
      .insert({
        parent_id: parentId,
        full_name: child.full_name,
        date_of_birth: child.date_of_birth,
        medical_notes: child.medical_notes ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    const newChild = data as Child;
    setChildren((prev) => [...prev, newChild]);
    return newChild;
  };

  const updateChild = async (childId: string, updates: Partial<Child>) => {
    const { error } = await supabase
      .from("children")
      .update(updates)
      .eq("id", childId);
    if (error) throw error;

    setChildren((prev) =>
      prev.map((c) => (c.id === childId ? { ...c, ...updates } : c))
    );
  };

  const removeChild = async (childId: string) => {
    const { error } = await supabase
      .from("children")
      .delete()
      .eq("id", childId);
    if (error) throw error;
    setChildren((prev) => prev.filter((c) => c.id !== childId));
  };

  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null;

  return {
    children,
    selectedChild,
    selectedChildId,
    setSelectedChildId,
    isLoading,
    fetchChildren,
    addChild,
    updateChild,
    removeChild,
  };
}
