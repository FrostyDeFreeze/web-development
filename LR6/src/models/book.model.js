import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database.js'

export class Book extends Model {}

Book.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		title: {
			type: DataTypes.STRING,
			allowNull: false
		},
		author: {
			type: DataTypes.STRING,
			allowNull: false
		},
		deletedAt: {
			type: DataTypes.DATE,
			allowNull: true
		}
	},
	{
		sequelize,
		modelName: `books`,
		timestamps: true,
		paranoid: true
	}
)
