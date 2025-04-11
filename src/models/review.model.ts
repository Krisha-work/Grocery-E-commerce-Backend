import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from './index';
import User from './user.model';
import Product from './product.model';

interface ReviewAttributes {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment: string;
}

interface ReviewCreationAttributes extends Omit<ReviewAttributes, 'id'> {}

class Review extends Model<ReviewAttributes, ReviewCreationAttributes> {
  public id!: number;
  public user_id!: number;
  public product_id!: number;
  public rating!: number;
  public comment!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initModel(sequelize: Sequelize): typeof Review {
    return this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        product_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        rating: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 1,
            max: 5,
          },
        },
        comment: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'reviews',
        modelName: 'Review',
      }
    );
  }

  public static associate(models: any) {
    Review.belongsTo(models.User, { foreignKey: 'user_id', as: 'userDetails' });
    Review.belongsTo(models.Product, { foreignKey: 'product_id', as: 'productDetails' });
  }
}

export default Review; 