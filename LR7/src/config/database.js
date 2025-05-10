import { Sequelize } from 'sequelize'

export const sequelize = new Sequelize(`lr7_db`, `cuvi`, `forsen`, {
	host: `localhost`,
	dialect: `postgres`,
	logging: true
})

export const init = async () => {
	try {
		await sequelize.authenticate()
		await sequelize.sync({ alter: true })
		console.log(`Connection to the database has been established successfully`)
	} catch (e) {
		console.error(`Unable to connect to the database:`, e)
	}
}
