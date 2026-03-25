export type ApiErrorDetails = Record<string, unknown>;

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details: ApiErrorDetails | undefined;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    details?: ApiErrorDetails,
    isOperational = true,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
  }
}
