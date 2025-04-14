import swaggerAutogen from 'swagger-autogen';
import path from 'path';
import fs from 'fs';

const outputFile = path.join(__dirname, '../src/swagger/swagger.json');
const endpointsFiles = [path.join(__dirname, '../routes/*.ts')];

const doc = {
  info: {
    title: 'E-commerce API Documentation',
    description: 'API documentation for the E-commerce platform',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
  },
  host: `${process.env.HOST || 'localhost'}:${process.env.PORT || 6001}`,
  basePath: '/',
  schemes: ['http', 'https'],
  securityDefinitions: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  definitions: {
    // Add your common response/request schemas here
  },
};

// Generate swagger.json
export const generateSwagger = () => {
  try {
    // Ensure the directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate the swagger.json file
    swaggerAutogen()(outputFile, endpointsFiles, doc);
    console.log('Swagger documentation generated successfully');
  } catch (error) {
    console.error('Error generating Swagger documentation:', error);
    throw error;
  }
}; 