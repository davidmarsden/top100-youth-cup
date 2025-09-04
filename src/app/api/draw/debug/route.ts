import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const headers = Object.fromEntries(req.headers.entries());
    const provided =
      headers["x-admin-key"] ||
      headers["authorization"] ||
      body?.adminKey ||
      null;

    return NextResponse.json({
      env: {
        has_ADMIN_KEY: !!process.env.ADMIN_KEY,
        has_ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
        has_ADMIN_API_KEY: !!process.env.ADMIN_API_KEY,
        has_NEXT_ADMIN_KEY: !!process.env.NEXT_ADMIN_KEY,
      },
      provided: provided
        ? { length: provided.length, startsWith: provided.slice(0, 2) }
        : null,
      expected: process.env.ADMIN_KEY
        ? { length: process.env.ADMIN_KEY.trim().length }
        : null,
      note:
        "These are just booleans and lengths — no secrets are exposed. If expected=null, your server has no ADMIN_KEY at runtime.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 }
    );
  }
}