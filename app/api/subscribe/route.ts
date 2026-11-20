import { NextResponse } from "next/server";
import { z } from "zod";

const LOOPS_API_KEY = process.env.LOOPS_API_KEY;

export async function POST(request: Request) {
  try {
    const { email, source, userGroup } = await request.json();

    if (!z.string().email().safeParse(email).success) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!LOOPS_API_KEY) {
      return NextResponse.json({ error: "Newsletter subscriptions are unavailable in this environment." }, { status: 503 });
    }

    const response = await fetch(
      "https://app.loops.so/api/v1/contacts/create",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOOPS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, source, userGroup }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to create contact in Loops");
    }

    const data = await response.json();

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (error) {
    console.error("Error in subscribe API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
