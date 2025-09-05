// src/app/api/draw/scrape/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "").trim();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "Missing `url` query parameter" }, { status: 400 });
    }

    const res = await fetch(url, {
      // A UA helps some hosting providers return normal HTML
      headers: { "user-agent": "Mozilla/5.0 (Autofill Scraper)" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream responded ${res.status}` }, { status: 502 });
    }

    const html = await res.text();

    // 1) Try a JSON-ish pattern: "winners": ["A","B","C"]
    let winners: string[] = [];
    const jsonLike = html.match(/"winners"\s*:\s*\[(.*?)\]/i);
    if (jsonLike && jsonLike[1]) {
      winners = jsonLike[1]
        .split(",")
        .map((s) => s.replace(/^[\s"'`]+|[\s"'`]+$/g, ""))
        .filter(Boolean);
    }

    // 2) Fallback: collect <li> items and pick the first three plausible names
    if (winners.length < 3) {
      const liMatches = [...html.matchAll(/<li[^>]*>(.*?)<\/li>/gis)].map((m) => stripHtml(m[1]));
      const plausible = liMatches.filter((x) => /[A-Za-z]/.test(x)).filter((x) => x.length <= 80);
      for (const p of plausible) {
        if (!winners.includes(p)) winners.push(p);
        if (winners.length === 3) break;
      }
    }

    // 3) Still short? Try headings/strong tags
    if (winners.length < 3) {
      const strong = [...html.matchAll(/<(h\d|strong|b)[^>]*>(.*?)<\/\1>/gis)].map((m) =>
        stripHtml(m[2]),
      );
      for (const s of strong) {
        if (!winners.includes(s) && /[A-Za-z]/.test(s)) winners.push(s);
        if (winners.length === 3) break;
      }
    }

    // Ensure at most three and trimmed
    winners = winners.slice(0, 3).map((x) => x.trim()).filter(Boolean);

    return NextResponse.json({ winners });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Scrape failed" }, { status: 500 });
  }
}