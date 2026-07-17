import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { recordPageView } from "@/lib/repo";

const schema = z.object({ path: z.string().min(1).max(200) });

/**
 * Log one page view. The client sends only the path; the user is taken from the
 * session cookie (never from the request body) so a visit can't be attributed to
 * someone else. Always answers 200 — analytics must never break a page.
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

    const session = await getSession();
    await recordPageView({
      path: parsed.data.path,
      userId: session?.id ?? null,
      userAgent: req.headers.get("user-agent"),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("page view logging failed:", err);
    return NextResponse.json({ ok: false });
  }
}
