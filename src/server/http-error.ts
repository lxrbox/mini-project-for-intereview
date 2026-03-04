import { NextResponse } from "next/server";

import { DomainError, isDomainError } from "./errors";

function statusByCode(error: DomainError): number {
  switch (error.code) {
    case "INVALID_AMOUNT":
    case "INVALID_RESULT":
      return 400;
    case "USER_NOT_FOUND":
    case "BET_NOT_FOUND":
      return 404;
    case "INSUFFICIENT_BALANCE":
    case "BET_NOT_PLACED":
      return 409;
    default:
      return 500;
  }
}

export function toErrorResponse(error: unknown) {
  if (isDomainError(error)) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
      },
      { status: statusByCode(error) },
    );
  }

  return NextResponse.json(
    {
      code: "INTERNAL_ERROR",
      message: "服务器内部错误",
    },
    { status: 500 },
  );
}
