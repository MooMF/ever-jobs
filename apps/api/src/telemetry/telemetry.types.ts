export type TelemetryStatus =
  | 'success'
  | 'partial'
  | 'failed'
  | 'blocked'
  | 'timeout'
  | 'user_interaction_required';

export interface TelemetryError {
  type?: string;
  message?: string;
  code?: string | number;
  stack?: string;
  raw?: unknown;
}

export interface TelemetryEvent {
  timestamp: string;

  source: string;

  query?: string;
  location?: string;

  success: boolean;
  status: TelemetryStatus;

  httpStatus?: number;

  latencyMs?: number;
  resultCount?: number;

  error?: TelemetryError | unknown;

  payload?: unknown;

  metadata?: Record<string, unknown>;
}