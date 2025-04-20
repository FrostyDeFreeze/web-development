import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database.js'

export class User extends Model {}

User.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		username: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				notEmpty: true,
				len: [3, 25]
			}
		},
		password: {
			type: DataTypes.STRING(128),
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},
		salt: {
			type: DataTypes.STRING(32),
			allowNull: false
		}
	},
	{
		sequelize,
		modelName: `users`,
		timestamps: true
	}
)
