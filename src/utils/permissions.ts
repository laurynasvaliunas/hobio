import type { Group, Organization } from "../types/database.types";

/**
 * Check if a user is the owner of a group (via organization ownership).
 * 
 * @param group - The group with its organization data
 * @param userId - The user ID to check
 * @returns true if the user owns the organization that owns the group
 */
export const isGroupOwner = (
  group: Group & { organization: Organization },
  userId: string
): boolean => {
  return group.organization.owner_id === userId;
};

/**
 * Check if a user is the owner of an organization.
 * 
 * @param org - The organization to check
 * @param userId - The user ID to check
 * @returns true if the user owns the organization
 */
export const isOrgOwner = (org: Organization, userId: string): boolean => {
  return org.owner_id === userId;
};
