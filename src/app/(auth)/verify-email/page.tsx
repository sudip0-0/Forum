import { MailCheck, MailWarning } from "lucide-react";
import { db } from "@/server/db/prisma";
import { verifyEmailToken } from "@/server/auth/email-verification";
import { ResendVerificationForm } from "./resend-form";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

const copy = {
  success: {
    title: "Email verified",
    body: "Your email address has been verified. You can now post and report content.",
  },
  expired: {
    title: "Verification link expired",
    body: "This verification link has expired. Request a new verification email below.",
  },
  invalid: {
    title: "Verification link invalid",
    body: "This verification link is invalid or has already been used.",
  },
  "already-verified": {
    title: "Email already verified",
    body: "This email address was already verified. You can continue using the forum.",
  },
} as const;

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const status = token ? await verifyEmailToken(db, token) : "invalid";
  const content = copy[status];
  const Icon = status === "success" || status === "already-verified" ? MailCheck : MailWarning;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-muted/10 to-background p-6">
      <div className="w-full max-w-md rounded-xl border-2 border-border bg-card p-6 text-center shadow-brutal-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-border bg-primary shadow-brutal-sm">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{content.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{content.body}</p>
        {(status === "expired" || status === "invalid") && <ResendVerificationForm />}
        <p className="mt-6 text-sm text-muted-foreground">
          <a href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Go to sign in
          </a>
        </p>
      </div>
    </div>
  );
}
