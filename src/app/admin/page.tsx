import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { isAdmin } from "@/server/auth/permissions";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (!isAdmin(session.user.role)) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Welcome, {session.user.name ?? session.user.email}.
      </p>

      <dl className="mt-8 space-y-3 text-sm">
        <div className="flex gap-2">
          <dt className="font-medium text-muted-foreground">User ID:</dt>
          <dd>{session.user.id}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-muted-foreground">Email:</dt>
          <dd>{session.user.email}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-muted-foreground">Role:</dt>
          <dd>{session.user.role}</dd>
        </div>
      </dl>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  );
}
