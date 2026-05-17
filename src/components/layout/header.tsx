"use client";

import { useState } from "react";
import Link from "next/link";
import { getCsrfToken, signOut } from "next-auth/react";
import { MailWarning, Menu, ShieldAlert, X, MessageSquareText, Search } from "lucide-react";
import type { Session } from "next-auth";
import type { AccountState } from "@/lib/account-state";

interface HeaderProps {
  session: Session | null;
  accountState: AccountState;
}

export function Header({ session, accountState }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await getCsrfToken();
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <header className="border-b-2 border-border bg-card shadow-[0_2px_0px_var(--border)]">
      {session?.user && accountState.kind === "unverified" && (
        <div className="border-b-2 border-border bg-warning/10 px-6 py-2 text-sm">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 font-medium text-foreground">
              <MailWarning className="h-4 w-4" />
              Verify your email to post, reply, or report.
            </span>
            <Link href="/verify-email" className="font-semibold text-link hover:no-underline">
              Resend verification
            </Link>
          </div>
        </div>
      )}
      {session?.user && accountState.kind === "suspended" && (
        <div className="border-b-2 border-border bg-destructive/10 px-6 py-2 text-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-2 font-medium text-foreground">
            <ShieldAlert className="h-4 w-4" />
            Your account is suspended. You can read public discussions, but posting and reporting are unavailable.
          </div>
        </div>
      )}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight hover:no-underline"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-border bg-primary text-sm font-bold text-primary-foreground shadow-[2px_2px_0px_var(--border)]">
              F
            </span>
            <span>Forums</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/forums"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground hover:no-underline"
            >
              Browse
            </Link>
            <Link
              href="/search"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground hover:no-underline"
            >
              Search
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <div className="hidden items-center gap-3 md:flex">
              <Link
                href={`/u/${session.user.username ?? session.user.email?.split("@")[0] ?? ""}`}
                className="text-sm font-medium hover:no-underline"
              >
                {session.user.name ?? session.user.email}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-md border-2 border-border bg-background px-3 py-1.5 text-xs font-semibold shadow-[2px_2px_0px_var(--border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="rounded-md border-2 border-border bg-background px-4 py-1.5 text-sm font-semibold shadow-[2px_2px_0px_var(--border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md border-2 border-border bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-[3px_3px_0px_var(--border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-border md:hidden"
            aria-label="Toggle menu"
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div id="mobile-navigation" className="border-t-2 border-border bg-card md:hidden">
          <div className="space-y-1 px-6 py-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent hover:no-underline"
              onClick={() => setMenuOpen(false)}
            >
              <MessageSquareText className="h-4 w-4" />
              Browse Forums
            </Link>
            <Link
              href="/search"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent hover:no-underline"
              onClick={() => setMenuOpen(false)}
            >
              <Search className="h-4 w-4" />
              Search
            </Link>
            <hr className="my-2 border-border" />
            {session?.user ? (
              <>
                <Link
                  href={`/u/${session.user.username ?? session.user.email?.split("@")[0] ?? ""}`}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent hover:no-underline"
                  onClick={() => setMenuOpen(false)}
                >
                  {session.user.name ?? session.user.email}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full rounded-md border-2 border-border bg-background px-3 py-2.5 text-sm font-semibold text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block rounded-md border-2 border-border bg-background px-3 py-2.5 text-sm font-semibold text-center hover:no-underline"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block rounded-md border-2 border-border bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground text-center hover:no-underline"
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
