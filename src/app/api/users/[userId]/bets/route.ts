import { NextResponse } from "next/server";

import { getUserGameSnapshot, placeBet } from "@/server/betting-service";
import { toErrorResponse } from "@/server/http-error";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await context.params;
    const snapshot = await getUserGameSnapshot(userId);
    return NextResponse.json(snapshot);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const body = (await req.json()) as { amount?: number };
    const { userId } = await context.params;

    if (typeof body.amount !== "number") {
      return NextResponse.json(
        { code: "INVALID_AMOUNT", message: "下注金额必须是数字类型。" },
        { status: 400 },
      );
    }

    const result = await placeBet(userId, body.amount);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
