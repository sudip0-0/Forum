"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { changeUserRole } from "./actions";
import type { AppRouterOutputs } from "@/server/api/root";

type UserItem = AppRouterOutputs["moderation"]["listUsers"]["users"][number];

const ROLE_OPTIONS = ["MEMBER", "MODERATOR", "ADMIN"] as const;

function roleBadge(role: string) {
  const colors: Record<string, string> = {
    ADMIN:
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    MODERATOR:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    MEMBER:
      "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  };
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${colors[role] ?? colors.MEMBER}`}
    >
      {role}
    </span>
  );
}

function UserRow({ user }: { user: UserItem }) {
  const router = useRouter();
  const [showChange, setShowChange] = useState(false);
  const [newRole, setNewRole] = useState<string>(user.role);
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

  return (
    <tr className="border-t">
      <td className="px-4 py-3 text-sm">
        <div className="font-medium">
          {user.displayName ?? user.username}
        </div>
        <div className="text-xs text-muted-foreground">@{user.username}</div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
        {user.email}
      </td>
      <td className="px-4 py-3">{roleBadge(user.role)}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right">
        {showChange ? (
          <div className="flex items-center gap-2 justify-end">
            <select
              className="rounded-md border bg-background px-2 py-1 text-sm"
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
            {error && (
              <span className="text-xs text-destructive">{error}</span>
            )}
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowChange(true)}
          >
            Change Role
          </Button>
        )}
      </td>
    </tr>
  );
}

export function UserList({ users }: { users: UserItem[] }) {
  return (
    <div className="mt-8 rounded-lg border overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b text-left text-xs font-medium text-muted-foreground">
            <th className="px-4 py-2">User</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Role</th>
            <th className="px-4 py-2">Joined</th>
            <th className="px-4 py-2 text-right">Actions</th>
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
