import { Model, DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export class File extends Model {}

File.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		key: {
			type: DataTypes.STRING,
			allowNull: false
		},
		original_name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		size: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		bucket: {
			type: DataTypes.STRING,
			allowNull: false
		},
		entity_id: {
			type: DataTypes.STRING,
			allowNull: true
		},
		mime_type: {
			type: DataTypes.STRING,
			allowNull: false
		}
	},
	{
		sequelize,
		modelName: `files`,
		timestamps: true,
		paranoid: true
	}
)
