import { Model, DataTypes } from 'sequelize';
import sequelize from './index';

class Contact extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public subject!: string;
  public message!: string;
  public status!: 'pending' | 'read' | 'replied';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initModel(sequelize: any) {
    Contact.init(
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
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isEmail: true,
          },
        },
        subject: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('pending', 'read', 'replied'),
          defaultValue: 'pending',
        },
      },
      {
        sequelize,
        tableName: 'contacts',
        modelName: 'Contact',
      }
    );
  }

  public static associate(models: any) {
    // No associations needed for Contact model
  }
}

export default Contact; 