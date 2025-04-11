import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ecommerce_db_dev',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: 70,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    match: [/Deadlock/i],
    max: 10,
  },
});

// Import models
import Product from './product.model';
import Category from './category.model';
import Review from './review.model';
import Order from './order.model';
import OrderItem from './orderItem.model';
import Contact from './contact.model';
import User from './user.model';

const models = {
  Product,
  Category,
  Review,
  Order,
  OrderItem,
  Contact,
  User
};

// Initialize models
Object.values(models).forEach((model: any) => {
  if (typeof model.initModel === 'function') {
    model.initModel(sequelize);
  }
});

// Set up associations after all models are initialized
Object.values(models).forEach((model: any) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

export { sequelize };
export default { sequelize, ...models }; 