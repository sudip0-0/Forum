"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { changeUserRole, toggleSuspension } from "./actions";
import type { AppRouterOutputs } from "@/server/api/root";
import { ShieldCheck, Shield, UserCheck } from "lucide-react";

type UserItem = AppRouterOutputs["moderation"]["listUsers"]["users"][number];

const ROLE_OPTIONS = ["MEMBER", "MODERATOR", "ADMIN"] as const;

function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { className: string; icon: typeof Shield }> = {
    ADMIN: { className: "badge-red", icon: ShieldCheck },
    MODERATOR: { className: "badge-blue", icon: Shield },
    MEMBER: { className: "badge-orange", icon: UserCheck },
  };
  const { className, icon: Icon } = config[role] ?? config.MEMBER;
  return (
    <span className={`${className} gap-1`}>
      <Icon className="h-3 w-3" />
      {role}
    </span>
  );
}

function UserRow({ user }: { user: UserItem }) {
  const router = useRouter();
  const [showChange, setShowChange] = useState(false);
  const [newRole, setNewRole] = useState<string>(user.role);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange() {
    if (newRole === user.role) return;
    setError(null);
    startTransition(async () => {
      const result = await changeUserRole({
        userId: user.id,
        role: newRole as "MEMBER" | "MODERATOR" | "ADMIN",
      });
      if (result.error) {
        setError(result.error);
      } else {
        setShowChange(false);
        router.refresh();
      }
    });
  }

  function handleSuspendToggle() {
    if (suspensionReason.trim().length < 3) {
      setError("A reason is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await toggleSuspension({
        userId: user.id,
        isSuspended: !user.isSuspended,
        reason: suspensionReason.trim(),
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSuspensionReason("");
        router.refresh();
      }
    });
  }

  return (
    <tr className="border-t border-border/50 transition-colors hover:bg-muted/20">
      <td className="px-4 py-3 text-sm">
        <div className="font-medium text-foreground">
          {user.displayName ?? user.username}
        </div>
        <div className="text-xs text-muted-foreground/70">@{user.username}</div>
        {user.isSuspended && (
          <span className="badge-red mt-1 inline-flex">
            Suspended
          </span>
        )}
      </td>
      <td className="max-w-[200px] truncate px-4 py-3 text-sm text-muted-foreground/70">
        {user.email}
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground/70">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center gap-2 justify-end flex-wrap">
          {showChange ? (
            <>
              <select
                className="input h-9 rounded-md border border-border bg-background px-2 py-1 text-sm"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                disabled={isPending}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={handleChange}
                disabled={isPending || newRole === user.role}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowChange(false);
                  setError(null);
                  setNewRole(user.role);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowChange(true)}
            >
              Change Role
            </Button>
          )}
          <input
            aria-label={`Suspension reason for ${user.username}`}
            data-testid={`suspension-reason-${user.username}`}
            className="input h-9 w-36 rounded-md border border-border bg-background px-2 py-1 text-sm"
            placeholder="Reason required"
            value={suspensionReason}
            onChange={(e) => setSuspensionReason(e.target.value)}
            disabled={isPending}
          />
          <Button
            size="sm"
            variant={user.isSuspended ? "default" : "outline"}
            onClick={handleSuspendToggle}
            disabled={isPending || suspensionReason.trim().length < 3}
          >
            {user.isSuspended ? "Unsuspend" : "Suspend"}
          </Button>
          {error && (
            <span className="w-full text-xs text-destructive">{error}</span>
          )}
        </div>
      </td>
    </tr>
  );
}

export function UserList({ users }: { users: UserItem[] }) {
  return (
    <div className="admin-card overflow-x-auto">
      <table className="w-full min-w-[750px]">
        <thead>
          <tr className="border-b border-border/50 text-left text-xs font-medium text-muted-foreground/70">
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
