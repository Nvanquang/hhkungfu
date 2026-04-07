import { useAuthStore } from "@/store/authStore";

/**
 * Returns true if the current user has the specified permission string.
 *
 * The `permissions` array in Zustand is populated from the JWT payload
 * (see authStore.setUser). It will be empty until the backend starts
 * including a `permissions` claim in the token.
 */
export function usePermission(permission: string): boolean {
  const permissions = useAuthStore((s) => s.permissions);
  return permissions.includes(permission);
}

/**
 * Returns true if the current user has ALL of the given roles.
 * Use this for AND-logic ("must be both ADMIN and MODERATOR").
 */
export function useHasRole(...requiredRoles: string[]): boolean {
  const roles = useAuthStore((s) => s.roles);
  return requiredRoles.every((r) => roles.includes(r));
}

/**
 * Returns true if the current user has ANY of the given roles.
 * Use this for OR-logic ("must be ADMIN or MODERATOR").
 */
export function useHasAnyRole(...allowedRoles: string[]): boolean {
  const roles = useAuthStore((s) => s.roles);
  return allowedRoles.some((r) => roles.includes(r));
}
