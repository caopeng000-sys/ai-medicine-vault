import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const eventId = Sentry.captureException(
    new Error("Sentry debug test from ai-medicine-vault"),
  );

  return NextResponse.json({
    ok: true,
    message: "Test error sent to Sentry. Check ali-7n/javascript-nextjs.",
    eventId,
  });
}
