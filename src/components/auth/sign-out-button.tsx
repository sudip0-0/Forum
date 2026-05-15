"use client";

import { getCsrfToken, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  async function handleSignOut() {
    await getCsrfToken();
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
    >
      Sign out
    </Button>
  );
}
