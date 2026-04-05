import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const SUBSCRIBERS_FILE = path.join(process.cwd(), "subscribers.json");

async function readSubscribers(): Promise<
  { email: string; source: string; timestamp: string }[]
> {
  try {
    const data = await fs.readFile(SUBSCRIBERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeSubscribers(
  subscribers: { email: string; source: string; timestamp: string }[]
) {
  await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
}

export async function POST(request: Request) {
  try {
    const { email, source } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    const subscribers = await readSubscribers();
    const exists = subscribers.some((s) => s.email === email);

    if (!exists) {
      subscribers.push({
        email,
        source: source || "hero",
        timestamp: new Date().toISOString(),
      });
      await writeSubscribers(subscribers);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
