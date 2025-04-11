import { Model, DataTypes, Sequelize } from 'sequelize';
import User from './user.model';
import OrderItem from './orderItem.model';

interface OrderAttributes {
  id: number;
  user_id: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  tracking_id: string;
  shipping_address: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_id: string;
}

interface OrderCreationAttributes extends Omit<OrderAttributes, 'id'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> {
  public id!: number;
  public user_id!: number;
  public total_amount!: number;
  public status!: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  public tracking_id!: string;
  public shipping_address!: string;
  public payment_status!: 'pending' | 'paid' | 'failed' | 'refunded';
  public payment_id!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public readonly OrderItems?: OrderItem[];

  // Add static initModel method
  public static initModel(sequelize: Sequelize): typeof Order {
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
        total_amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        status: {
          type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
          allowNull: false,
          defaultValue: 'pending',
        },
        tracking_id: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true,
        },
        shipping_address: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        payment_status: {
          type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
          allowNull: false,
          defaultValue: 'pending',
        },
        payment_id: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'orders',
        modelName: 'Order'
      }
    );
  }

  // Add static associate method
  public static associate(models: any) {
    Order.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'userDetails',
    });

    Order.hasMany(models.OrderItem, {
      foreignKey: 'order_id',
      as: 'orderDetails',
    });
  }
}

export default Order; 