import { Model, DataTypes, Sequelize } from 'sequelize';
import bcrypt from 'bcrypt';

interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  is_verified: boolean;
  verification_token: string | null;
  reset_password_token: string | null;
  reset_password_expires: Date | null;
  is_admin: boolean;
}

interface UserCreationAttributes extends Omit<UserAttributes, 'id'> {}

class User extends Model<UserAttributes, UserCreationAttributes> {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public is_verified!: boolean;
  public verification_token!: string | null;
  public reset_password_token!: string | null;
  public reset_password_expires!: Date | null;
  public is_admin!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Instance method to check password
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    console.log('Comparing passwords:');
    console.log('Candidate password:', candidatePassword);
    console.log('Stored password hash:', this.password);
    const result = await bcrypt.compare(candidatePassword, this.password);
    console.log('Comparison result:', result);
    return result;
  }

  public static initModel(sequelize: Sequelize): typeof User {
    return this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        username: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            is: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[_.])[a-zA-Z0-9_.]{5,30}$/, // Alphanumeric, underscore, and dot
          },
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            len: [8, 100], // Minimum length of 8 characters
          },
        },
        is_verified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        verification_token: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        reset_password_token: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        reset_password_expires: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        is_admin: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
      },
      {
        sequelize,
        tableName: 'users',
        modelName: 'User',
        hooks: {
          beforeCreate: async (user: User) => {
            if (user.password) {
              user.password = await bcrypt.hash(user.password, 10);
            }
          },
          beforeUpdate: async (user: User) => {
            if (user.changed('password')) {
              user.password = await bcrypt.hash(user.password, 10);
            }
          },
        },
      }
    );
  }

  public static associate(models: any) {
    User.hasMany(models.Order, { foreignKey: 'user_id', as: 'orderDetails' });
    User.hasMany(models.Review, { foreignKey: 'user_id', as: 'reviewDetails' });
  }
}

export default User; 