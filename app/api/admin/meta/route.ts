import { NextResponse } from "next/server";

import { db } from "@/lib/config";

export async function GET() {
  try {
    const [developers, agents] = await Promise.all([db.getDevelopers(), db.getAgents()]);

    return NextResponse.json({
      ok: true,
      data: {
        developers,
        agents
      }
    });
  } catch (error) {
    console.error("[admin/meta] Failed to load metadata", error);
    return NextResponse.json({ ok: false, error: "Failed to load admin metadata" }, { status: 500 });
  }
}
