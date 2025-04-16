import { Model, DataTypes, Sequelize } from 'sequelize';
import Cart from './cart.model';
import Product from './product.model';

interface CartItemAttributes {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  price: number;
  productDetails?: Product;
}

interface CartItemCreationAttributes extends Omit<CartItemAttributes, 'id' | 'productDetails'> {}

class CartItem extends Model<CartItemAttributes, CartItemCreationAttributes> {
  public id!: number;
  public cart_id!: number;
  public product_id!: number;
  public quantity!: number;
  public price!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public productDetails?: Product;

  public static initModel(sequelize: Sequelize): typeof CartItem {
    return this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        cart_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        product_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
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
        tableName: 'cart_items',
        modelName: 'CartItem'
      }
    );
  }

  public static associate(models: any) {
    CartItem.belongsTo(models.Cart, {
      foreignKey: 'cart_id',
      as: 'cartDetails',
    });

    CartItem.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'productDetails',
    });
  }
}

export default CartItem; 