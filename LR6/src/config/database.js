import { Sequelize } from 'sequelize'

export const sequelize = new Sequelize(`postgres://cuvi:forsen@localhost:5432/lr6_db`, { logging: true })
