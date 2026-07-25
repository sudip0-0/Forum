import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") ?? "";
  const match = resource.match(/^acct:([^@]+)@(.+)$/i);
  if (!match) {
    return NextResponse.json({ error: "Invalid resource" }, { status: 400 });
  }
  const username = match[1]!;
  const user = await db.user.findUnique({
    where: { username },
    select: { username: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const host = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? url.origin;
  return NextResponse.json({
    subject: resource,
    links: [
      {
        rel: "http://webfinger.net/rel/profile-page",
        type: "text/html",
        href: `${host}/u/${user.username}`,
      },
    ],
  });
}
