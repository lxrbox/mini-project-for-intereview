import { NextResponse } from "next/server";

import { settleBet } from "@/server/betting-service";
import { toErrorResponse } from "@/server/http-error";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  context: { params: Promise<{ betId: string }> },
) {
  try {
    const body = (await req.json()) as { result?: "WIN" | "LOSE" };
    const { betId } = await context.params;

    if (body.result !== "WIN" && body.result !== "LOSE") {
      return NextResponse.json(
        { code: "INVALID_RESULT", message: "结算结果必须是 WIN 或 LOSE。" },
        { status: 400 },
      );
    }

    const result = await settleBet(betId, body.result);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
