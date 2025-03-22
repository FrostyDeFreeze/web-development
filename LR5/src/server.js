import Fastify from 'fastify'
import { sequelize } from './config/database.js'
import { Book } from './models/book.model.js'

// GET: Список всех книг: curl --location 'http://localhost:8000/api/book' --header 'accept: application/json'

// GET: Получить информацию о книге по ID: curl --location 'http://localhost:8000/api/book/1' --header 'accept: application/json'

// GET: Список книг с пагинацией: curl --location 'http://localhost:8000/api/book?limit=2&page=1' --header 'accept: application/json'

// POST: Добавить новую книгу: curl --location --request POST 'http://localhost:8000/api/book' --header 'Content-Type: application/json' --data '{ "title": "1984", "author": "George Orwell" }'

// PUT: Обновить всю информацию о книге: curl --location --request PUT 'http://localhost:8000/api/book/1' --header 'Content-Type: application/json' --data '{ "title": "Brave New World", "author": "Aldous Huxley" }'

// PATCH: Частично обновить информацию о книге: curl --location --request PATCH 'http://localhost:8000/api/book/1' --header 'Content-Type: application/json' --data '{ "title": "Brave New World Revised" }'

// DELETE: Удалить книгу по ID: curl --location --request DELETE 'http://localhost:8000/api/book/1' --header 'accept: application/json'

const fastify = Fastify({ logger: true })

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
