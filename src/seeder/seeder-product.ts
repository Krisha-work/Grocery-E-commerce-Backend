// products-seeder.js
const { Pool } = require('pg');
const products = [
    {
      name: "Organic Fuji Apples",
      description: "Sweet, crisp and juicy organic Fuji apples grown in Washington state. Perfect for snacking or baking.",
      price: 2.99,
      stock: 150,
      category: "Fruits",
      imageUrl: "https://example.com/images/fuji-apples.jpg"
    },
    {
      name: "Bananas (Bunch)",
      description: "Premium ripe bananas, rich in potassium and perfect for a quick energy boost.",
      price: 1.49,
      stock: 200,
      category: "Fruits",
      imageUrl: "https://example.com/images/bananas.jpg"
    },
    {
      name: "Organic Baby Spinach",
      description: "Fresh organic baby spinach leaves, packed with nutrients and perfect for salads or cooking.",
      price: 3.49,
      stock: 80,
      category: "Vegetables",
      imageUrl: "https://example.com/images/baby-spinach.jpg"
    },
    {
      name: "Carrots (1 lb)",
      description: "Sweet and crunchy carrots, great for snacking, juicing or cooking.",
      price: 1.29,
      stock: 120,
      category: "Vegetables",
      imageUrl: "https://example.com/images/carrots.jpg"
    },
    {
      name: "Whole Grain Bread",
      description: "Nutritious whole grain bread with no artificial preservatives, perfect for sandwiches.",
      price: 3.99,
      stock: 60,
      category: "Bakery",
      imageUrl: "https://example.com/images/whole-grain-bread.jpg"
    },
    {
      name: "Free Range Eggs (Dozen)",
      description: "Large free range eggs from humanely raised chickens, rich in protein and omega-3.",
      price: 4.49,
      stock: 90,
      category: "Dairy & Eggs",
      imageUrl: "https://example.com/images/eggs.jpg"
    },
    {
      name: "Organic Whole Milk (1 Gallon)",
      description: "Creamy organic whole milk from grass-fed cows, packed with calcium and vitamin D.",
      price: 5.99,
      stock: 50,
      category: "Dairy & Eggs",
      imageUrl: "https://example.com/images/whole-milk.jpg"
    },
    {
      name: "Grass-Fed Ground Beef (1 lb)",
      description: "Premium 85% lean grass-fed ground beef, perfect for burgers, meatballs and more.",
      price: 7.99,
      stock: 40,
      category: "Meat & Seafood",
      imageUrl: "https://example.com/images/ground-beef.jpg"
    },
    {
      name: "Atlantic Salmon Fillet",
      description: "Fresh Atlantic salmon fillet, rich in omega-3 fatty acids and perfect for grilling or baking.",
      price: 12.99,
      stock: 30,
      category: "Meat & Seafood",
      imageUrl: "https://example.com/images/salmon.jpg"
    },
    {
      name: "Organic Brown Rice (2 lbs)",
      description: "Nutritious organic brown rice with a nutty flavor and chewy texture.",
      price: 3.49,
      stock: 75,
      category: "Pantry",
      imageUrl: "https://example.com/images/brown-rice.jpg"
    },
    {
      name: "Extra Virgin Olive Oil (16 oz)",
      description: "Premium cold-pressed extra virgin olive oil, perfect for cooking and dressings.",
      price: 8.99,
      stock: 45,
      category: "Pantry",
      imageUrl: "https://example.com/images/olive-oil.jpg"
    },
    {
      name: "Organic Dark Chocolate (3.5 oz)",
      description: "70% cocoa organic dark chocolate bar, rich in antioxidants and delicious flavor.",
      price: 3.99,
      stock: 65,
      category: "Snacks",
      imageUrl: "https://example.com/images/dark-chocolate.jpg"
    },
    {
      name: "Almond Butter (16 oz)",
      description: "Creamy almond butter made from 100% roasted almonds with no added sugar.",
      price: 9.49,
      stock: 35,
      category: "Pantry",
      imageUrl: "https://example.com/images/almond-butter.jpg"
    },
    {
      name: "Greek Yogurt (32 oz)",
      description: "Creamy non-fat Greek yogurt packed with protein and probiotics.",
      price: 4.99,
      stock: 55,
      category: "Dairy & Eggs",
      imageUrl: "https://example.com/images/greek-yogurt.jpg"
    },
    {
      name: "Organic Strawberries (1 lb)",
      description: "Sweet and juicy organic strawberries, perfect for desserts or smoothies.",
      price: 4.49,
      stock: 70,
      category: "Fruits",
      imageUrl: "https://example.com/images/strawberries.jpg"
    },
    {
      name: "Avocados (4 pack)",
      description: "Creamy Hass avocados, rich in healthy fats and perfect for guacamole or toast.",
      price: 5.99,
      stock: 85,
      category: "Fruits",
      imageUrl: "https://example.com/images/avocados.jpg"
    },
    {
      name: "Organic Chicken Breast (1 lb)",
      description: "Boneless, skinless organic chicken breast, lean and high in protein.",
      price: 8.49,
      stock: 40,
      category: "Meat & Seafood",
      imageUrl: "https://example.com/images/chicken-breast.jpg"
    },
    {
      name: "Whole Wheat Pasta (16 oz)",
      description: "Nutritious whole wheat pasta with a hearty texture and nutty flavor.",
      price: 2.49,
      stock: 95,
      category: "Pantry",
      imageUrl: "https://example.com/images/whole-wheat-pasta.jpg"
    },
    {
      name: "Organic Tomato Sauce (24 oz)",
      description: "Flavorful organic tomato sauce made with vine-ripened tomatoes and herbs.",
      price: 3.29,
      stock: 60,
      category: "Pantry",
      imageUrl: "https://example.com/images/tomato-sauce.jpg"
    },
    {
      name: "Mixed Nuts (16 oz)",
      description: "Delicious mix of almonds, cashews, walnuts and pecans with no salt added.",
      price: 7.99,
      stock: 45,
      category: "Snacks",
      imageUrl: "https://example.com/images/mixed-nuts.jpg"
    }
  ];

// PostgreSQL connection configuration
const pool = new Pool({
  user: 'postgress',
  host: 'localhost',
  database: '',
  password: 'your_password',
  port: 5432,
});

async function seedProducts() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Clear existing products
    await client.query('DELETE FROM products');
    
    // Insert new products
    const insertQuery = `
      INSERT INTO products (name, description, price, stock, category, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    for (const product of products) {
      await client.query(insertQuery, [
        product.name,
        product.description,
        product.price,
        product.stock,
        product.category,
        // product.image_url
      ]);
    }
    
    await client.query('COMMIT');
    console.log('Database seeded successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
  } finally {
    client.release();
    pool.end();
    process.exit();
  }
}

seedProducts();