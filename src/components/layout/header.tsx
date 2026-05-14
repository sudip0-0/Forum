"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link href="/forums" className="text-base font-semibold">
          Forum
        </Link>

        <nav className="hidden items-center gap-4 sm:flex">
          <Link
            href="/search"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Search
          </Link>
          {session?.user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {session.user.name ?? session.user.email}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => signOut()}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button size="sm" variant="ghost">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </nav>

        <button
          className="sm:hidden p-2 min-h-[44px] min-w-[44px]"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t px-6 py-3 sm:hidden space-y-3">
          <Link
            href="/search"
            className="block text-sm text-muted-foreground hover:text-foreground py-1"
            onClick={() => setMenuOpen(false)}
          >
            Search
          </Link>
          {session?.user ? (
            <>
              <span className="block text-sm text-muted-foreground py-1">
                {session.user.name ?? session.user.email}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => signOut()}
              >
                Logout
              </Button>
            </>
          ) : (
            <div className="flex gap-3">
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                <Button size="sm" variant="ghost">
                  Login
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}>
                <Button size="sm">Register</Button>
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
