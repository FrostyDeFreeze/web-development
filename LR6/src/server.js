import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import fastifyRedis from '@fastify/redis'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'

import { sequelize } from './config/database.js'
import { Book } from './models/index.js'
import { UserService } from './services/user.service.js'

// Register: curl -X POST http://localhost:8000/register -H "Content-Type: application/json" -d '{ "username": "asd1", "password": "asd1" }'

// Login: curl -X POST http://localhost:8000/login -H "Content-Type: application/json" -d '{ "username": "asd1", "password": "asd2" }'

// Me: curl -X GET http://localhost:8000/me -H "Content-Type: application/json" -H "Cookie: access_token="

// Logout: curl -X GET http://localhost:8000/logout -H "Content-Type: application/json" -H "Cookie: access_token="

// Logout active: curl -X GET http://localhost:8000/logout/active -H "Content-Type: application/json" -H "Cookie: access_token="

const fastify = Fastify({
	logger: true
})

fastify.register(fastifyJwt, {
	secret: `xd`,
	cookie: {
		cookieName: `access_token`,
		signed: false,
		expiresIn: `2d`
	}
})

fastify.register(fastifyRedis, {
	host: `127.0.0.1`,
	password: `forsen`
})

fastify.decorate(`authenticate`, async function (request, reply) {
	try {
		const user = await request.jwtVerify()
		const token = request.cookies.access_token

		if (!token) {
			throw new Error(`No token provided`)
		}

		const sessionKeys = await fastify.redis.smembers(`user:sessions:${user.id}`)
		let validSession = false

		for (const key of sessionKeys) {
			const sessionToken = await fastify.redis.get(key)
			if (token === sessionToken) {
				validSession = true
				request.sessionKey = key
				break
			}
		}

		if (!validSession) {
			throw new Error(`Invalid token`)
		}
	} catch (err) {
		reply.code(401).send({ error: `Unauthorized` })
	}
})

fastify.register(fastifyCookie, {
	secret: `lol`,
	hook: `onRequest`,
	parseOptions: {}
})

fastify.post(`/register`, async function handler(request, reply) {
	const { error, data: result } = await UserService.register(request.body)

	if (error) {
		reply.code(400).send({ error: error.message || `Internal server error` })
		return
	}

	reply.code(201).send(result)
})

fastify.post(`/login`, async function handler(request, reply) {
	const { error, data: user } = await UserService.login(request.body)

	if (error) {
		return { error }
	}

	const token = fastify.jwt.sign(user.dataValues, { expiresIn: `2d` })
	const sessionKey = `user:access_token:${user.id}:${crypto.randomBytes(8).toString(`hex`)}`

	await fastify.redis.set(sessionKey, token, `EX`, 172800)
	await fastify.redis.sadd(`user:sessions:${user.id}`, sessionKey)

	reply.setCookie(`access_token`, token, {
		domain: `localhost`,
		path: `/`,
		secure: true,
		sameSite: true,
		expires: DateTime.now().plus({ days: 2 }).toJSDate()
	})

	return { message: `Login successful` }
})

fastify.get(`/logout`, { onRequest: [fastify.authenticate] }, async function handler(request, reply) {
	const { sessionKey } = request
	const user = request.user

	await fastify.redis.del(sessionKey)
	await fastify.redis.srem(`user:sessions:${user.id}`, sessionKey)

	reply.clearCookie(`access_token`)
	return { message: `Logged out successfully` }
})

fastify.get(`/logout/active`, { onRequest: [fastify.authenticate] }, async function handler(request, reply) {
	const { sessionKey } = request
	const user = request.user

	const sessionKeys = await fastify.redis.smembers(`user:sessions:${user.id}`)

	for (const key of sessionKeys) {
		if (key !== sessionKey) {
			await fastify.redis.del(key)
			await fastify.redis.srem(`user:sessions:${user.id}`, key)
		}
	}

	return { message: `All other sessions terminated` }
})

fastify.get(
	`/me`,
	{
		onRequest: [fastify.authenticate]
	},
	async function handler(request, reply) {
		const { error, data: user } = await UserService.get(request.user.id)

		if (error) {
			return { error: `Internal server error` }
		}

		return user
	}
)

// GET: Список всех книг с пагинацией
fastify.get(`/api/book`, async (request, reply) => {
	const { limit = 10, page = 1 } = request.query
	const offset = (page - 1) * limit

	try {
		const { rows: books, count } = await Book.findAndCountAll({ limit, offset })
		reply.send({ books, total: count })
	} catch (e) {
		fastify.log.error(e)
		reply.code(500).send({ error: `Internal server error` })
	}
})

// GET: Получить информацию о книге по ID
fastify.get(`/api/book/:id`, async (request, reply) => {
	const { id } = request.params

	try {
		const book = await Book.findByPk(id)

		if (!book) {
			return reply.code(404).send({ message: `Book not found` })
		}

		reply.send(book)
	} catch (e) {
		fastify.log.error(e)
		reply.code(500).send({ error: `Internal server error` })
	}
})

// POST: Добавить новую книгу
fastify.post(`/api/book`, async (request, reply) => {
	const { title, author } = request.body

	try {
		const newBook = await Book.create({ title, author })
		reply.code(201).send(newBook)
	} catch (e) {
		fastify.log.error(e)
		reply.code(500).send({ error: `Internal server error` })
	}
})

// PUT: Обновить всю информацию о книге
fastify.put(`/api/book/:id`, async (request, reply) => {
	const { id } = request.params
	const { title, author } = request.body

	try {
		const book = await Book.findByPk(id)

		if (!book) {
			return reply.code(404).send({ message: `Book not found` })
		}

		await book.update({ title, author })
		reply.send(book)
	} catch (e) {
		fastify.log.error(e)
		reply.code(500).send({ error: `Internal server error` })
	}
})

// PATCH: Частично обновить информацию о книге
fastify.patch(`/api/book/:id`, async (request, reply) => {
	const { id } = request.params
	const updates = request.body

	try {
		const book = await Book.findByPk(id)

		if (!book) {
			return reply.code(404).send({ message: `Book not found` })
		}

		await book.update(updates)
		reply.send(book)
	} catch (e) {
		fastify.log.error(e)
		reply.code(500).send({ error: `Internal server error` })
	}
})

// DELETE: Мягкое удаление книги
fastify.delete(`/api/book/:id`, async (request, reply) => {
	const { id } = request.params
	try {
		const book = await Book.findByPk(id)

		if (!book) {
			return reply.code(404).send({ message: `Book not found` })
		}

		await book.destroy()
		reply.send({ message: `Book deleted successfully` })
	} catch (e) {
		fastify.log.error(e)
		reply.code(500).send({ error: `Internal server error` })
	}
})

const start = async () => {
	try {
		await sequelize.authenticate()
		await sequelize.sync({ alter: true })
		await fastify.listen({ port: 8000 })
		console.log(`Server is running on port 8000`)
	} catch (e) {
		fastify.log.error(e)
		process.exit(1)
	}
}

start()
