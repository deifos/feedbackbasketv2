// Global error handling utilities

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle API errors consistently
export function handleApiError(error: unknown): ApiError {
  if (error instanceof AppError) {
    return {
      error: 'Application Error',
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      error: 'Internal Server Error',
      message:
        process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
    };
  }

  return {
    error: 'Unknown Error',
    message: 'An unexpected error occurred',
  };
}

// Log errors (can be extended with external logging services)
export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';

  if (error instanceof Error) {
    console.error(`${timestamp} ${contextStr} Error:`, error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack:', error.stack);
    }
  } else {
    console.error(`${timestamp} ${contextStr} Unknown error:`, error);
  }
}

// Async error handler wrapper
export function asyncHandler<T extends unknown[], R>(fn: (...args: T) => Promise<R>) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, 'AsyncHandler');
      throw error;
    }
  };
}
