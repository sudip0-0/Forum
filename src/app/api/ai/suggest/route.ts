import { NextResponse } from "next/server";
import { auth } from "@/server/auth/config";

export async function POST(request: Request) {
  if (process.env.FEATURE_AI !== "1" || !process.env.AI_API_URL) {
    return NextResponse.json({ suggestions: null, disabled: true });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { content?: string };
  const content = body.content?.slice(0, 2000) ?? "";
  try {
    const res = await fetch(process.env.AI_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.AI_API_KEY
          ? { authorization: `Bearer ${process.env.AI_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        prompt: `Suggest a short forum title and up to 3 tags for:\n${content}`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json({ suggestions: null });
    const data = await res.json();
    return NextResponse.json({ suggestions: data });
  } catch {
    return NextResponse.json({ suggestions: null });
  }
}
