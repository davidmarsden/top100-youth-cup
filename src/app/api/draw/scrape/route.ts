import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing `url` query parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Look specifically for the "Result" section
    let winners: string[] = [];

    // The winners are usually inside links under "Result:"
    $("div:contains('Result:')").each((_, el) => {
      $(el)
        .find("a")
        .each((i, link) => {
          const name = $(link).text().trim();
          if (name) winners.push(name);
        });
    });

    // fallback: if nothing found, just collect last bold/links
    if (winners.length === 0) {
      $("a").each((i, link) => {
        const text = $(link).text().trim();
        if (/place #\d+:/i.test($(link).parent().text())) {
          winners.push(text);
        }
      });
    }

    return NextResponse.json({ winners });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}