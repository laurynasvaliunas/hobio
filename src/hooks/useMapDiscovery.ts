import { useState, useEffect, useCallback, useRef } from "react";
import * as Location from "expo-location";
import { supabase } from "../lib/supabase";
import { haversineDistance } from "../lib/geo";
import { DEFAULT_REGION } from "../lib/geo";
import type { Group, Location as LocationType } from "../types/database.types";

export interface MapGroup {
  group: Group;
  location: LocationType;
  distance: number | null; // km from user
  isMember: boolean;
  sportCategory: string | null;
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface UseMapDiscoveryReturn {
  userLocation: { latitude: number; longitude: number } | null;
  region: MapRegion;
  myGroups: MapGroup[];
  discoveryGroups: MapGroup[];
  allMapGroups: MapGroup[];
  isLoading: boolean;
  error: string | null;
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
  activeFilter: string | null;
  setActiveFilter: (filter: string | null) => void;
  hasMoved: boolean;
  handleRegionChange: (newRegion: MapRegion) => void;
  searchThisArea: () => void;
  fetchGroups: (searchRegion?: MapRegion) => Promise<void>;
}

export function useMapDiscovery(profileId: string): UseMapDiscoveryReturn {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [region, setRegion] = useState<MapRegion>(DEFAULT_REGION);
  const [myGroups, setMyGroups] = useState<MapGroup[]>([]);
  const [discoveryGroups, setDiscoveryGroups] = useState<MapGroup[]>([]);
  const [allMapGroups, setAllMapGroups] = useState<MapGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [hasMoved, setHasMoved] = useState(false);

  const myGroupIdsRef = useRef<Set<string>>(new Set());
  const initialRegionRef = useRef<MapRegion | null>(null);

  // Request user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Location permission not granted");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setUserLocation(coords);

        const userRegion = {
          ...coords,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        };
        setRegion(userRegion);
        initialRegionRef.current = userRegion;
      } catch (err) {
        console.warn("Location error, using default:", err);
      }
    })();
  }, []);

  // Fetch groups with location data
  const fetchGroups = useCallback(
    async (searchRegion?: MapRegion) => {
      if (!profileId) return;
      setIsLoading(true);
      setError(null);

      try {
        // 1. Get user's group memberships
        const { data: memberships } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("profile_id", profileId)
          .eq("status", "active");

        const memberGroupIds = new Set(
          (memberships ?? []).map((m) => m.group_id)
        );
        myGroupIdsRef.current = memberGroupIds;

        // 2. Also include groups from user's organizations
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id")
          .eq("owner_id", profileId);
        const orgIds = (orgs ?? []).map((o) => o.id);

        let orgGroupIds: string[] = [];
        if (orgIds.length > 0) {
          const { data: orgGroups } = await supabase
            .from("groups")
            .select("id")
            .in("organization_id", orgIds);
          orgGroupIds = (orgGroups ?? []).map((g) => g.id);
          orgGroupIds.forEach((id) => memberGroupIds.add(id));
        }

        // 3. Fetch all active groups with their locations + organization sport_category
        const { data: allGroups, error: groupsError } = await supabase
          .from("groups")
          .select("*, locations(*), organizations(sport_category)")
          .eq("is_active", true)
          .not("location_id", "is", null);

        if (groupsError) throw groupsError;

        // 4. Build MapGroup items
        const mapGroups: MapGroup[] = [];
        for (const g of allGroups ?? []) {
          const raw = g as Record<string, unknown>;
          const loc = raw.locations as LocationType | null;
          if (!loc || loc.latitude == null || loc.longitude == null) continue;

          const org = raw.organizations as { sport_category: string } | null;

          const distance = userLocation
            ? haversineDistance(
                userLocation.latitude,
                userLocation.longitude,
                loc.latitude,
                loc.longitude
              )
            : null;

          mapGroups.push({
            group: g as Group,
            location: loc,
            distance,
            isMember: memberGroupIds.has(g.id),
            sportCategory: org?.sport_category ?? null,
          });
        }

        // Sort by distance
        mapGroups.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));

        const mine = mapGroups.filter((g) => g.isMember);
        const discovery = mapGroups.filter((g) => !g.isMember);

        setMyGroups(mine);
        setDiscoveryGroups(discovery);
        setAllMapGroups(mapGroups);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        console.error("Map groups fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [profileId, userLocation]
  );

  // Initial fetch
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Detect map movement
  const handleRegionChange = useCallback(
    (newRegion: MapRegion) => {
      setRegion(newRegion);
      if (initialRegionRef.current) {
        const drift = haversineDistance(
          initialRegionRef.current.latitude,
          initialRegionRef.current.longitude,
          newRegion.latitude,
          newRegion.longitude
        );
        setHasMoved(drift > 0.5); // > 500m away from initial position
      }
    },
    []
  );

  // Search this area
  const searchThisArea = useCallback(() => {
    setHasMoved(false);
    initialRegionRef.current = region;
    fetchGroups(region);
  }, [region, fetchGroups]);

  // Get filtered groups by sport category
  const filteredGroups = activeFilter
    ? allMapGroups.filter((g) => g.sportCategory === activeFilter)
    : allMapGroups;

  return {
    userLocation,
    region,
    myGroups,
    discoveryGroups,
    allMapGroups: filteredGroups,
    isLoading,
    error,
    selectedGroupId,
    setSelectedGroupId,
    activeFilter,
    setActiveFilter,
    hasMoved,
    handleRegionChange,
    searchThisArea,
    fetchGroups,
  };
}
