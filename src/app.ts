import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs';
import { generateSwagger } from './swagger/swagger-autogen';
import { securityMiddleware } from './middleware/security';
import { authLimiter, apiLimiter } from './middleware/rateLimiter';

// Import routes
import productRoutes from './routes/product.routes';
import userRoutes from './routes/user.routes';
import orderRoutes from './routes/order.routes';
import reviewRoutes from './routes/review.routes';
import categoryRoutes from './routes/category.routes';
import cartRoutes from './routes/cart.routes'

dotenv.config();

const app = express();

// Security middleware
app.use(securityMiddleware);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

// Logging middleware
app.use(morgan('dev'));

// Increase payload size limit
// app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));

// Handle uncaught errors
// process.on('uncaughtException', (err) => {
//   console.error('Uncaught Exception:', err);
// });

// process.on('unhandledRejection', (err) => {
//   console.error('Unhandled Rejection:', err);
// });

// File upload middleware - must come before express.json()
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true
}));

// JSON parsing middleware
app.use(express.json());

// Cookie and session middleware
app.use(cookieParser());
app.use(session({
  secret: process.env.JWT_SECRET || 'test-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Generate Swagger documentation
try {
  generateSwagger();
} catch (error) {
  console.error('Failed to generate Swagger documentation:', error);
}

// Swagger UI setup
const swaggerFile = path.join(__dirname, '../swagger/swagger.json');
console.log(swaggerFile);
if (fs.existsSync(swaggerFile)) {
  console.log('Swagger documentation file found');
  const swaggerDocument = require(swaggerFile);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  console.warn('Swagger documentation file not found. API documentation will not be available.');
}

// Demo api
app.get("/demo", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Hello World",
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart/', cartRoutes)


// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app; 