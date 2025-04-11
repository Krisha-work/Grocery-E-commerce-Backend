import { Request, Response } from 'express';
import db from '../models';
import { generateToken } from '../middleware/auth';
import { sendVerificationEmail, sendPasswordResetEmail, sendProfileUpdateVerificationEmail } from '../config/email';
import crypto from 'crypto';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import { Session, SessionData } from 'express-session';
import User from '../models/user.model';
import { handleResponse, HTTP_STATUS } from '../utils/responseHandler';
import { StatusCode } from '../config/statusCode';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation';

// Extend Express Session type
declare module 'express-session' {
  interface SessionData {
    otp?: string;
    newProfileData?: {
      username: string;
      email: string;
    };
  }
}

const sendValidationError = (res: Response, validation: any) =>
  handleResponse(res, HTTP_STATUS.ERROR_STATUS, validation.status || StatusCode.BAD_REQUEST, validation.message);

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Input validation
    if (!username || !email || !password) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.BAD_REQUEST,
        'All fields are required'
      );
    }

    const validations = [
      validateEmail(email),
      validateUsername(username),
      validatePassword(password)
    ];
    for (const v of validations) if (!v.isValid) return sendValidationError(res, v);

    // Check for existing user
    const existingUser = await db.User.findOne({ 
      where: { 
        [Op.or]: [{ username }, { email }] 
      } 
    });
    
    if (existingUser) {
      return handleResponse(
        res,
        HTTP_STATUS.ERROR_STATUS,
        StatusCode.BAD_REQUEST,
        'Username or email already exists'
      );
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Create user
    const user = await db.User.create({
      username,
      email,
      password,
      verification_token: verificationToken,
      is_verified: false,
      is_admin: false
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }

    // Generate token and set cookie
    const token = generateToken(user as User & { isAdmin: boolean });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400000 // 24 hours
    });

    return handleResponse(
      res,
      HTTP_STATUS.SUCCESS_STATUS,
      StatusCode.CREATED,
      'User registered successfully',
      {
        id: user.id,
        username: user.username,
        email: user.email,
        is_verified: user.is_verified
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return handleResponse(
      res,
      HTTP_STATUS.ERROR_STATUS,
      StatusCode.INTERNAL_SERVER_ERROR,
      'Registration failed. Please try again later.'
    );
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password, rememberMe } = req.body;
    console.log('Login attempt for:', usernameOrEmail);
    
    const user = await db.User.findOne({ where: { [Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }] } });
    if (!user) {
      console.log('User not found');
      return handleResponse(res, HTTP_STATUS.ERROR_STATUS, StatusCode.UNAUTHORIZED, 'Invalid credentials');
    }    

    console.log('User found:', {
      id: user.id,
      username: user.username,
      email: user.email,
      is_verified: user.is_verified


    });

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      console.log('Invalid credentials - password mismatch');
      return handleResponse(res, HTTP_STATUS.ERROR_STATUS, StatusCode.UNAUTHORIZED, 'Invalid credentials');
    }

    const token = generateToken(user as User & { isAdmin: boolean });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: rememberMe ? 2592000000 : 86400000 // 30 days or 24 hours
    });
    console.log('Token generated:', token);

    return handleResponse(res, HTTP_STATUS.SUCCESS_STATUS, StatusCode.OK, 'Login successful', {
      id: user.id, username: user.username, email: user.email, token:token
    });
  } catch {
    return handleResponse(res, HTTP_STATUS.ERROR_STATUS, StatusCode.INTERNAL_SERVER_ERROR, 'Login failed');
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  return handleResponse(res, HTTP_STATUS.SUCCESS_STATUS, StatusCode.OK, 'Logout successful');
};

export const getProfile = async (req: Request, res: Response) => {
  const user = req.user!;
  return handleResponse(res, HTTP_STATUS.SUCCESS_STATUS, StatusCode.OK, 'Profile fetched successfully', {
    id: user.id, username: user.username, email: user.email
  });
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;
    const user = req.user!;
    const validations = [validateEmail(email), validateUsername(username)];
    for (const v of validations) if (!v.isValid) return sendValidationError(res, v);

    const otp = crypto.randomInt(100000, 999999).toString();
    console.log('OTP:', otp);
    await sendProfileUpdateVerificationEmail(user.email, otp);
    req.session.otp = otp;
    req.session.newProfileData = { username, email };

    return handleResponse(res, HTTP_STATUS.SUCCESS_STATUS, StatusCode.OK, 'OTP sent to your email');
  } catch {
    return handleResponse(res, HTTP_STATUS.ERROR_STATUS, StatusCode.INTERNAL_SERVER_ERROR, 'Profile update failed');
  }
};

export const verifyProfileUpdate = async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    const user = req.user!;
    if (otp !== req.session.otp) return handleResponse(res, HTTP_STATUS.ERROR_STATUS, StatusCode.BAD_REQUEST, 'Invalid OTP');

    const { username, email } = req.session.newProfileData!;
    await user.update({ username, email });
    delete req.session.otp;
    delete req.session.newProfileData;

    return handleResponse(res, HTTP_STATUS.SUCCESS_STATUS, StatusCode.OK, 'Profile updated', {
      id: user.id, username: user.username, email: user.email
    });
  } catch {
    return handleResponse(res, HTTP_STATUS.ERROR_STATUS, StatusCode.INTERNAL_SERVER_ERROR, 'OTP verification failed');
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const user = req.user!;
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) return sendValidationError(res, passwordValidation);
    if (!(await user.comparePassword(oldPassword))) return handleResponse(res, HTTP_STATUS.ERROR_STATUS, StatusCode.BAD_REQUEST, 'Incorrect old password');
    if (newPassword !== confirmPassword) return handleResponse(res, HTTP_STATUS.ERROR_STATUS, StatusCode.BAD_REQUEST, 'Passwords do not match');

    await user.update({ password: newPassword });
    return handleResponse(res, HTTP_STATUS.SUCCESS_STATUS, StatusCode.OK, 'Password updated');
  } catch {
    return handleResponse(res, HTTP_STATUS.ERROR_STATUS, StatusCode.INTERNAL_SERVER_ERROR, 'Password reset failed');
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) return sendValidationError(res, emailValidation);

    const user = await db.User.findOne({ where: { email } });
    if (!user) return handleResponse(res, HTTP_STATUS.ERROR_STATUS, StatusCode.NOT_FOUND, 'User not found');

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);
    await user.update({ reset_password_token: token, reset_password_expires: expires });
    await sendPasswordResetEmail(email, token);

    return handleResponse(res, HTTP_STATUS.SUCCESS_STATUS, StatusCode.OK, 'Password reset email sent');
  } catch {
    return handleResponse(res, HTTP_STATUS.ERROR_STATUS, StatusCode.INTERNAL_SERVER_ERROR, 'Forgot password failed');
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const user = await db.User.findOne({ where: { verification_token: token } });
    console.log('User:', user);
    if (!user) return handleResponse(res, HTTP_STATUS.ERROR_STATUS, StatusCode.BAD_REQUEST, 'Invalid token');

    await user.update({ is_verified: true, verification_token: null });
    return handleResponse(res, HTTP_STATUS.SUCCESS_STATUS, StatusCode.OK, 'Email verified');
  } catch (error) {
    console.error('Email verification error:', error);
    return handleResponse(res, HTTP_STATUS.ERROR_STATUS, StatusCode.INTERNAL_SERVER_ERROR, 'Email verification failed');
  }
}; 