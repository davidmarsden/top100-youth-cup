import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/draw/scrape?url=<encoded ticket url>
 * Returns { winners: string[] } where winners[0..2] are the top 3.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed: ${res.status}` }, { status: 502 });
    }
    const html = await res.text();

    // Very simple, resilient pick of “place #1”, “place #2”, “place #3”
    // Adjust if RandomResult changes markup.
    const winners: string[] = [];
    const m1 = html.match(/place\s*#1[^<]*<\/a>\s*:\s*<\/td>\s*<td[^>]*>\s*([^<]+)/i);
    const m2 = html.match(/place\s*#2[^<]*<\/a>\s*:\s*<\/td>\s*<td[^>]*>\s*([^<]+)/i);
    const m3 = html.match(/place\s*#3[^<]*<\/a>\s*:\s*<\/td>\s*<td[^>]*>\s*([^<]+)/i);
    if (m1?.[1]) winners.push(m1[1].trim());
    if (m2?.[1]) winners.push(m2[1].trim());
    if (m3?.[1]) winners.push(m3[1].trim());

    if (winners.length < 3) {
      return NextResponse.json({ error: "Could not parse 3 winners from ticket" }, { status: 422 });
    }
    return NextResponse.json({ winners });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Scrape error" }, { status: 500 });
  }
}