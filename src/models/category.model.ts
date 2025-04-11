import { Model, DataTypes, Sequelize } from 'sequelize';
// Remove the circular dependency
// import sequelize from './index';
import Product from './product.model';

interface CategoryAttributes {
  id: number;
  name: string;
  description: string;
}

interface CategoryCreationAttributes extends Omit<CategoryAttributes, 'id'> {}

class Category extends Model<CategoryAttributes, CategoryCreationAttributes> {
  public id!: number;
  public name!: string;
  public description!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initModel(sequelize: Sequelize): typeof Category {
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
          unique: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'categories',
        modelName: 'Category',
      }
    );
  }

  public static associate(models: any) {
    Category.hasMany(models.Product, {
      foreignKey: 'category',
      as: 'categoryDetail',
    });
  } 
}

export default Category; 