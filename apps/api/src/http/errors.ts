/**
 * Error taxonomy (PRD §14.5). Every API error response is
 * {code, message, details?, requestId} — never a bare string or stack trace.
 */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const AUTH_REQUIRED = (message = "Authentication required"): ApiError =>
  new ApiError("AUTH_REQUIRED", message, 401);

export const ROLE_FORBIDDEN = (message = "Insufficient role for this action"): ApiError =>
  new ApiError("ROLE_FORBIDDEN", message, 403);

export const WORKSPACE_MISMATCH = (
  message = "Resource does not belong to this workspace",
): ApiError => new ApiError("WORKSPACE_MISMATCH", message, 403);

export const NOT_FOUND = (resource: string): ApiError =>
  new ApiError("NOT_FOUND", `${resource} not found`, 404);

export const VALIDATION_FAILED = (details: Record<string, unknown>): ApiError =>
  new ApiError("VALIDATION_FAILED", "Request validation failed", 400, details);

export const SOURCE_UNAVAILABLE = (source: string): ApiError =>
  new ApiError("SOURCE_UNAVAILABLE", `${source} is currently unavailable`, 503);
