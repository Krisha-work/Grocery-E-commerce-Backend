# Grocery E-commerce Backend

A microservices-based backend for a grocery e-commerce application built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- RESTful API
- PostgreSQL database with Sequelize ORM
- TypeScript support
- Microservices architecture
- Secure authentication
- Product management
- Order management
- User management

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd grocery-ecommerce
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add the following variables:
```
PORT=6001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grocery_e_commerce
DB_USER=your_username
DB_PASSWORD=root
JWT_SECRET=SecretKey
JWT_EXPIRES_IN=24h
```

4. Create the database:
```bash
createdb grocery_ecommerce
```

5. Run migrations:
```bash
npx sequelize-cli db: migrate
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

### Products
- `POST /api/products` - Create a new product
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a specific product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── models/         # Database models
├── routes/         # API routes
├── migrations/     # Database migrations
└── index.ts        # Application entry point
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 