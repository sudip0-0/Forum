import { NextResponse } from "next/server";
import { auth } from "@/server/auth/config";
import {
  detectMagic,
  isAllowedUpload,
  saveLocalUpload,
} from "@/server/storage";
import { checkRateLimit, type RateLimitConfig } from "@/server/api/rate-limit";

const RL_UPLOAD: RateLimitConfig = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
  keyPrefix: "upload",
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.isSuspended) {
    return NextResponse.json({ error: "Suspended" }, { status: 403 });
  }

  try {
    await checkRateLimit(session.user.id, RL_UPLOAD);
  } catch {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const purpose = form.get("purpose") === "attachment" ? "attachment" : "avatar";
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const maxBytes = purpose === "avatar" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectMagic(buffer);
  if (!isAllowedUpload(detected, purpose)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const url = await saveLocalUpload(buffer, detected!);
  return NextResponse.json({ url });
}
