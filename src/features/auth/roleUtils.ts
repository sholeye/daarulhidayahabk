import { UserRole } from '@/types';

const ROLE_PRIORITY: UserRole[] = ['admin', 'instructor', 'parent', 'learner'];

export const isUserRole = (value: unknown): value is UserRole =>
  value === 'admin' || value === 'instructor' || value === 'parent' || value === 'learner';

export const pickPrimaryRole = (
  roleRows: Array<{ role: unknown }> | null | undefined,
  fallbackRole?: unknown,
): UserRole => {
  const validRoles = (roleRows || [])
    .map((row) => row.role)
    .filter(isUserRole);

  if (validRoles.length > 0) {
    return [...validRoles].sort(
      (a, b) => ROLE_PRIORITY.indexOf(a) - ROLE_PRIORITY.indexOf(b),
    )[0];
  }

  if (isUserRole(fallbackRole)) return fallbackRole;

  return 'learner';
};
