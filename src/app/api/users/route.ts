import { NextResponse } from "next/server";

import { getUsersWithBalance } from "@/server/betting-service";
import { toErrorResponse } from "@/server/http-error";

export const runtime = "nodejs";

export async function GET() {
  try {
    const users = await getUsersWithBalance();
    return NextResponse.json({ users });
  } catch (error) {
    return toErrorResponse(error);
  }
}
