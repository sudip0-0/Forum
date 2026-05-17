export type AccountState =
  | { kind: "anonymous" }
  | { kind: "unverified"; email?: string | null }
  | { kind: "suspended" }
  | { kind: "ready" };

export type AccountAction = "create-thread" | "reply" | "report" | "edit";

type AccountStateUser = {
  email?: string | null;
  emailVerified?: Date | string | null;
  isSuspended?: boolean | null;
} | null;

export function getAccountStateFromUser(user: AccountStateUser): AccountState {
  if (!user) return { kind: "anonymous" };
  if (user.isSuspended) return { kind: "suspended" };
  if (!user.emailVerified) return { kind: "unverified", email: user.email };
  return { kind: "ready" };
}

export function canPerformAccountAction(
  accountState: AccountState,
  action: AccountAction,
): boolean {
  if (accountState.kind === "suspended" || accountState.kind === "anonymous") {
    return false;
  }

  if (action === "edit") {
    return true;
  }

  return accountState.kind === "ready";
}
