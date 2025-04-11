import { Response } from 'express';
import { StatusCode } from '../config/statusCode';

// Common messages
export const MESSAGES = {
  SERVER_ERROR: 'Internal server error',
  DB_ERROR: 'Database error occurred',
  VALIDATION_ERROR: 'Validation error occurred',
  DUPLICATE_ENTRY: 'Duplicate entry found'
};

// HTTP Status text
export const HTTP_STATUS = {
  SUCCESS_STATUS: 'success',
  ERROR_STATUS: 'error'
};

// Interface for pagination
interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

// Interface for API response
interface ApiResponse<T = any> {
  status: string;
  statusCode: number;
  message: string | Array<{ field: string; message: string }>;
  data?: T;
  pagination?: Pagination;
}

/**
 * Handles successful API responses
 * @param res Express Response object
 * @param status Success/Error status
 * @param statusCode HTTP status code
 * @param message Response message
 * @param data Response data (optional)
 * @param pagination Pagination info (optional)
 */
export const handleResponse = <T>(
  res: Response,
  status: string,
  statusCode: number,
  message: string,
  data?: T,
  pagination?: Pagination
): Response => {
  const responseObj: ApiResponse<T> = { status, statusCode, message };

  if (data !== undefined) {
    responseObj.data = data;
  }
  if (pagination) {
    responseObj.pagination = pagination;
  }
  return res.status(statusCode).json(responseObj);
};

/**
 * Handles unexpected errors in the API
 * @param error Error object
 * @param response Initial response object
 * @param res Express Response object
 */
export const handleUnExpectedError = (
  error: any,
  response: Partial<ApiResponse>,
  res: Response
): Response => {
  response.status = HTTP_STATUS.ERROR_STATUS;
  response.statusCode = StatusCode.INTERNAL_SERVER_ERROR;

  // Handle unique constraint violations
  if (error?.errors?.[0]?.type === 'unique violation') {
    response.message = MESSAGES.DUPLICATE_ENTRY;
  }
  // Handle validation errors
  else if (error.name === 'ValidationError') {
    response.statusCode = StatusCode.BAD_REQUEST;
    if (error.inner && error.inner.length > 0) {
      const validationErrors = error.inner.map((err: any) => ({
        field: err.path,
        message: err.message,
      }));
      response.message = validationErrors;
    } else {
      response.message = error.message || MESSAGES.VALIDATION_ERROR;
    }
  }
  // Handle database errors
  else if (error?.name?.startsWith('Sequelize')) {
    response.message = MESSAGES.DB_ERROR;
  }
  // Handle errors with response data
  else if (error?.response?.data?.message) {
    response.message = error.response.data.message;
  }
  // Handle general errors with messages
  else if (error.message) {
    response.message = error.message;
  }
  // Default error message
  else {
    response.message = MESSAGES.SERVER_ERROR;
  }

  return res.status(response.statusCode).json(response);
}; 