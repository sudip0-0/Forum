"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateProfile } from "./actions";

export function ProfileEditForm({
  username,
  initialDisplayName,
  initialBio,
}: {
  username: string;
  initialDisplayName: string;
  initialBio: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [image, setImage] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
        Edit Profile
      </Button>
    );
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateProfile(username, { displayName, bio, image });
      if (result.error) {
        setError(result.error);
      } else {
        setEditing(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border p-4">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <input
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        placeholder="Display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        disabled={isPending}
      />
      <textarea
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        placeholder="Bio"
        rows={3}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        disabled={isPending}
      />
      <input
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        disabled={isPending}
        className="block w-full text-sm"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const body = new FormData();
          body.set("file", file);
          body.set("purpose", "avatar");
          const res = await fetch("/api/upload", { method: "POST", body });
          if (!res.ok) {
            setError("Avatar upload failed.");
            return;
          }
          const data = (await res.json()) as { url?: string };
          if (data.url) setImage(data.url);
        }}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
