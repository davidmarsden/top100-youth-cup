import { NextRequest, NextResponse } from "next/server";

// Very small HTML-entity unescape (enough for names)
function unescapeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing `url` query parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      // RR sometimes behaves better with a UA set
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PrizeDrawBot/1.0)" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch ticket (${res.status})` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const lower = html.toLowerCase();

    // Focus parsing on the "Result:" area to avoid grabbing header text
    let slice = html;
    const idx = lower.indexOf("result:");
    if (idx !== -1) {
      // Take a window after "Result:" to keep regexes fast & precise
      slice = html.slice(idx, idx + 4000);
    }

    // Try exact places 1..3 first (link text is the name)
    const winners: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const rx = new RegExp(
        // place #X: ... <a>NAME</a>
        `place\\s*#\\s*${i}\\s*:\\s*(?:<[^>]*>\\s*)*<a[^>]*>([^<]+)</a>`,
        "i"
      );
      const m = slice.match(rx);
      if (m && m[1]) winners.push(unescapeHtml(m[1].trim()));
    }

    // Fallback: grab any "place #n:" lines that have a link after them
    if (winners.length < 3) {
      const rxAll =
        /place\s*#\s*(\d+)\s*:\s*(?:<[^>]*>\s*)*<a[^>]*>([^<]+)<\/a>/gi;
      const found: Record<number, string> = {};
      let m: RegExpExecArray | null;
      while ((m = rxAll.exec(slice))) {
        const n = parseInt(m[1], 10);
        const name = unescapeHtml(m[2].trim());
        if (n >= 1 && n <= 3 && name && !found[n]) found[n] = name;
      }
      for (let i = 1; i <= 3; i++) {
        if (!winners[i - 1] && found[i]) winners[i - 1] = found[i];
      }
    }

    // Final clean-up and guard
    const cleaned = winners.filter(Boolean).slice(0, 3);
    if (cleaned.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not find winners in the ticket HTML (is the Result section visible?)",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ winners: cleaned });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Scrape failed" }, { status: 500 });
  }
}