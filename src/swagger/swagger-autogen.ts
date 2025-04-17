import swaggerAutogen from 'swagger-autogen';
import path from 'path';

const doc = {
  info: {
    title: 'E-Commerce API',
    description: 'Documentation for the E-Commerce Backend API',
    version: '1.0.0',
  },
  host: process.env.NODE_ENV === 'production' 
    ? 'your-production-url' 
    : 'localhost:5000',
  basePath: '/',
  schemes: ['http', 'https'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
    },
  },
  definitions: {
    User: {
      id: 1,
      username: 'string',
      email: 'string',
      is_verified: true,
      is_admin: false,
    },
    Product: {
      id: 1,
      name: 'string',
      description: 'string',
      price: 0,
      stock: 0,
    },
  },
};

const outputFile = path.join(__dirname, 'swagger.json');
const endpointsFiles = [path.join(__dirname, '../routes/*.ts')];

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
  console.log('Swagger documentation generated successfully');
}); 