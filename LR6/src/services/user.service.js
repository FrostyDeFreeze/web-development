import crypto from 'node:crypto'
import { User } from '../models/index.js'

export class UserService {
	static generateSalt() {
		return crypto.randomBytes(16).toString(`hex`)
	}

	static hashPassword(password, salt) {
		return crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`)
	}

	static async register(payload) {
		try {
			if (!payload.username || !payload.password) {
				throw new Error(`Username and password are required`)
			}

			const existing = await User.findOne({
				where: { username: payload.username }
			})

			if (existing) {
				throw new Error(`Username already exists`)
			}

			const salt = this.generateSalt()
			const hashedPass = this.hashPassword(payload.password, salt)

			const result = await User.create({
				username: payload.username,
				password: hashedPass,
				salt
			})

			const { password, salt: userSalt, ...userData } = result.dataValues
			return { error: null, data: userData }
		} catch (e) {
			console.error(e)
			return { error: e, data: null }
		}
	}

	static async login(payload) {
		try {
			const user = await User.findOne({ where: { username: payload.username } })
			if (!user) {
				return { error: `User not found`, data: null }
			}

			const hashedPassword = this.hashPassword(payload.password, user.salt)
			if (hashedPassword !== user.password) {
				return { error: `Invalid password`, data: null }
			}

			return { error: null, data: user }
		} catch (e) {
			console.error(e)
			return { error: e, data: null }
		}
	}

	static async get(userId) {
		try {
			const user = await User.findByPk(userId)
			if (!user) {
				return { error: `User not found`, data: null }
			}

			const { password, salt, ...userData } = user.dataValues
			return { error: null, data: userData }
		} catch (e) {
			console.error(e)
			return { error: e, data: null }
		}
	}
}
