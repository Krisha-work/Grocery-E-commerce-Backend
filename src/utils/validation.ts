import { StatusCode } from '../config/statusCode';

interface ValidationResponse {
  status?: StatusCode;
  message?: string;
  isValid?: boolean;
}

// Password Validation
export const validatePassword = (password: string): ValidationResponse => {
  if (!password) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: "Password is required",
    };
  }

  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!regex.test(password)) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: "Password must contain at least 8 characters, including one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)",
    };
  }

  return { isValid: true };
};

// Email Validation
export const validateEmail = (email: string): ValidationResponse => {
  if (!email) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: "Email is required",
    };
  }

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: "Please provide a valid email address",
    };
  }

  return { isValid: true };
};

// Username Validation
export const validateUsername = (username: string): ValidationResponse => {
  if (!username) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: "Username is required",
    };
  }

  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[_.])[a-zA-Z0-9_.]{5,30}$/;
  if (!regex.test(username)) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: "Username can only contain letters, numbers, dots, and underscores",
    };
  }

  return { isValid: true };
};

// Phone Number Validation
export const validatePhone = (phone: string): ValidationResponse => {
  if (!phone) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: "Phone number is required",
    };
  }

  const regex = /^\+?[1-9]\d{9,14}$/;
  if (!regex.test(phone)) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: "Please provide a valid phone number",
    };
  }

  return { isValid: true };
};

// Name Validation (for first name, last name, etc.)
export const validateName = (name: string, fieldName: string = 'Name'): ValidationResponse => {
  if (!name) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: `${fieldName} is required`,
    };
  }

  if (name.length < 2 || name.length > 50) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: `${fieldName} must be between 2 and 50 characters`,
    };
  }

  const regex = /^[a-zA-Z\s-']+$/;
  if (!regex.test(name)) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
    };
  }

  return { isValid: true };
};

// URL Validation
export const validateURL = (url: string): ValidationResponse => {
  if (!url) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: "URL is required",
    };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return {
      status: StatusCode.BAD_REQUEST,
      message: "Please provide a valid URL",
    };
  }
};

// Date Validation
export const validateDate = (date: string): ValidationResponse => {
  if (!date) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: "Date is required",
    };
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: "Please provide a valid date",
    };
  }

  return { isValid: true };
};

// Price Validation
export const validatePrice = (price: number): ValidationResponse => {
  if (price === undefined || price === null) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: "Price is required",
    };
  }

  if (typeof price !== 'number' || isNaN(price)) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: "Price must be a valid number",
    };
  }

  if (price < 0) {
    return {
      status: StatusCode.BAD_REQUEST,
      message: "Price cannot be negative",
    };
  }

  return { isValid: true };
}; 