import type { UserRole } from "@prisma/client";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  MEMBER: 0,
  MODERATOR: 1,
  ADMIN: 2,
};

export function hasRole(
  userRole: UserRole | undefined | null,
  requiredRole: UserRole,
): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === "ADMIN";
}

export function isModeratorOrAbove(role: UserRole | undefined | null): boolean {
  return role === "MODERATOR" || role === "ADMIN";
}

export function isMemberOrAbove(role: UserRole | undefined | null): boolean {
  return !!role;
}
