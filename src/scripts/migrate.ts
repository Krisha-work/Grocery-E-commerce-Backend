import { Sequelize } from 'sequelize';
import db from '../models';
import fs from 'fs';
import path from 'path';

interface TableResult {
  [key: string]: string;
}

const runMigrations = async () => {
  // First, connect to the default postgres database to create our database
  const adminSequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres', // Connect to default postgres database
    username: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    logging: console.log,
  });

  try {
    // Create database if it doesn't exist
    await adminSequelize.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} created successfully`);
  } catch (error) {
    // If database already exists, we can ignore the error
    if (error instanceof Error && !error.message.includes('already exists')) {
      console.error('Error creating database:', error);
      return;
    }
  } finally {
    await adminSequelize.close();
  }

  try {
    // Drop all tables if they exist
    const [tables] = await db.sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
    );
    
    for (const table of tables as TableResult[]) {
      const tableName = Object.values(table)[0];
      await db.sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    }

    // Read and execute migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const migration = require(path.join(migrationsDir, file));
      await migration.up(db.sequelize.getQueryInterface(), Sequelize);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await db.sequelize.close();
  }
};

runMigrations(); 