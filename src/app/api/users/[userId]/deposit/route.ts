import { NextResponse } from "next/server";

import { createDeposit } from "@/server/betting-service";
import { toErrorResponse } from "@/server/http-error";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const body = (await req.json()) as { amount?: number };
    const { userId } = await context.params;

    if (typeof body.amount !== "number") {
      return NextResponse.json(
        { code: "INVALID_AMOUNT", message: "充值金额必须是数字类型。" },
        { status: 400 },
      );
    }

    const result = await createDeposit(userId, body.amount);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
