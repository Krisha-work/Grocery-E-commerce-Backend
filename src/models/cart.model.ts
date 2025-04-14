import { Model, DataTypes, Sequelize } from 'sequelize';
import User from './user.model';
import CartItem from './cartItem.model';

interface CartAttributes {
  id: number;
  user_id: number;
  total_amount: number;
}

interface CartCreationAttributes extends Omit<CartAttributes, 'id'> {}

class Cart extends Model<CartAttributes, CartCreationAttributes> {
  public id!: number;
  public user_id!: number;
  public total_amount!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public readonly CartItems?: CartItem[];

  public static initModel(sequelize: Sequelize): typeof Cart {
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
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
      },
      {
        sequelize,
        tableName: 'carts',
        modelName: 'Cart'
      }
    );
  }

  public static associate(models: any) {
    Cart.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'userDetails',
    });

    Cart.hasMany(models.CartItem, {
      foreignKey: 'cart_id',
      as: 'cartItems',
    });
  }
}

export default Cart; 