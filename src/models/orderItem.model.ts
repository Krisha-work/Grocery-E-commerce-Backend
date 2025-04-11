import { Model, DataTypes } from 'sequelize';
import sequelize from './index';  
import Order from './order.model';
import Product from './product.model';

class OrderItem extends Model {
  public id!: number;
  public order_id!: number;
  public product_id!: number;
  public quantity!: number;
  public price!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initModel(sequelize: any) {
    OrderItem.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        order_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'orders',
            key: 'id',
          },
        },
        product_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'products',
            key: 'id',
          },
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 1,
          },
        },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: {
            min: 0,
          },
        },
      },
      {
        sequelize,
        tableName: 'order_items',
        modelName: 'OrderItem',
      }
    );
  }

  public static associate(models: any) {
    OrderItem.belongsTo(models.Order, { foreignKey: 'order_id', as: 'orderDetails' });
    OrderItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'productDetails' });
  }
}

export default OrderItem; 