import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";
import { resolveEmailConfig } from "@/server/email/config";
import { createEmailProvider } from "@/server/email";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mailer = createEmailProvider(resolveEmailConfig());
  const users = await db.user.findMany({
    where: { digestFrequency: { in: ["daily", "weekly"] } },
    select: { id: true, email: true, digestFrequency: true },
  });

  let sent = 0;
  for (const user of users) {
    const since =
      user.digestFrequency === "weekly"
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const unread = await db.notification.count({
      where: { userId: user.id, readAt: null, createdAt: { gte: since } },
    });
    if (unread === 0) continue;
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    await mailer.send({
      to: user.email,
      subject: `Your Forum digest (${unread} unread)`,
      text: `You have ${unread} unread notification(s). Visit ${appUrl}/notifications`,
    });
    sent += 1;
  }

  return NextResponse.json({ sent });
}

export const GET = POST;
