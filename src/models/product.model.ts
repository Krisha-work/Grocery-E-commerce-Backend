import { Model, DataTypes, Sequelize } from 'sequelize';
// Remove the circular dependency
// import sequelize from './index';
import Category from './category.model';

interface ProductAttributes {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: number;
  image_url: string ;
  created_at?: Date;
  updated_at?: Date;
}

interface ProductCreationAttributes extends Omit<ProductAttributes, 'id'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> {
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  public stock!: number;
  public category!: number;
  public image_url!: string ;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initModel(sequelize: Sequelize): typeof Product {
    return this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        stock: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        category: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'categories',
            key: 'id'
          }
        },
        image_url: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        }
      },
      {
        sequelize,
        tableName: 'products',
        modelName: 'Product'
      }
    );
  }

  public static associate(models: any) {
    Product.belongsTo(models.Category, {
      foreignKey: 'category',
      as: 'categoryDetail'
    });
  }
}

export default Product; 