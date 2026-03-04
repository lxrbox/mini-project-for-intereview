export type DomainErrorCode =
  | "INVALID_AMOUNT"
  | "INSUFFICIENT_BALANCE"
  | "USER_NOT_FOUND"
  | "BET_NOT_FOUND"
  | "BET_NOT_PLACED"
  | "INVALID_RESULT";

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
