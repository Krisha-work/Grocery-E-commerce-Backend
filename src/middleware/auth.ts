import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

interface JwtPayload {
  id: number;
  isAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: User & { isAdmin: boolean };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    console.log('Token:', token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    console.log('Decoded:', decoded);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = Object.assign(user, { isAdmin: decoded.isAdmin });
    next();
  } catch (error) {
    console.log('Error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.dataValues?.is_admin) {
    console.log(req.user?.dataValues);
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export const generateToken = (user: User & { isAdmin: boolean }): string => {
  const payload: JwtPayload = {
    id: user.id,
    isAdmin: user.isAdmin
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h'
  });
}; 