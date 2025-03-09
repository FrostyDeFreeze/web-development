import Fastify from 'fastify'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = import.meta.dirname
const DATA_PATH = path.join(__dirname, `data/books.json`)

// GET: Список всех книг: curl --location 'http://localhost:8000/api/book' --header 'accept: application/json'

// GET: Получить информацию о книге по ID: curl --location 'http://localhost:8000/api/book/1' --header 'accept: application/json'

// GET: Список книг с пагинацией: curl --location 'http://localhost:8000/api/book?limit=2&page=1' --header 'accept: application/json'

// POST: Добавить новую книгу: curl --location --request POST 'http://localhost:8000/api/book' --header 'Content-Type: application/json' --data '{ "title": "1984", "author": "George Orwell" }'

// PUT: Обновить всю информацию о книге: curl --location --request PUT 'http://localhost:8000/api/book/1' --header 'Content-Type: application/json' --data '{ "title": "Brave New World", "author": "Aldous Huxley" }'

// PATCH: Частично обновить информацию о книге: curl --location --request PATCH 'http://localhost:8000/api/book/1' --header 'Content-Type: application/json' --data '{ "title": "Brave New World Revised" }'

// DELETE: Удалить книгу по ID: curl --location --request DELETE 'http://localhost:8000/api/book/1' --header 'accept: application/json'

const loadBooks = () => {
	try {
		return JSON.parse(fs.readFileSync(DATA_PATH, `utf8`))
	} catch (e) {
		return []
	}
}

const saveBooks = books => {
	fs.writeFileSync(DATA_PATH, JSON.stringify(books, null, 2), `utf8`)
}

let books = loadBooks()

const fastify = Fastify({ logger: true })

const bookSchema = {
	type: `object`,
	required: [`title`, `author`],
	properties: {
		title: { type: `string` },
		author: { type: `string` }
	}
}

// GET: Список всех книг с пагинацией
fastify.get(
	`/api/book`,
	{
		schema: {
			querystring: {
				type: `object`,
				properties: {
					limit: { type: `number`, default: 10 },
					page: { type: `number`, default: 1 }
				}
			}
		}
	},
	(request, reply) => {
		const { limit, page } = request.query

		const pageSize = limit
		const pageNum = page - 1
		const paginatedBooks = books.slice(pageNum * pageSize, (pageNum + 1) * pageSize)

		reply.send(paginatedBooks)
	}
)

// GET: Получить информацию о книге по ID
fastify.get(`/api/book/:id`, (request, reply) => {
	const { id } = request.params
	const book = books.find(b => b.id === parseInt(id, 10))

	if (book) {
		reply.send(book)
	} else {
		reply.code(404).send({ message: `Book not found` })
	}
})

// POST: Добавить новую книгу
fastify.post(
	`/api/book`,
	{
		schema: {
			body: bookSchema
		}
	},
	(request, reply) => {
		const { title, author } = request.body

		const maxId = books.length > 0 ? Math.max(...books.map(book => book.id)) : 0
		const newBook = { id: maxId + 1, title, author }

		books.push(newBook)
		saveBooks(books)

		reply.code(201).send(newBook)
	}
)

// PUT: Обновить всю информацию о книге
fastify.put(
	`/api/book/:id`,
	{
		schema: {
			body: bookSchema
		}
	},
	(request, reply) => {
		const { id } = request.params
		const { title, author } = request.body
		const index = books.findIndex(b => b.id === parseInt(id, 10))

		if (index === -1) {
			reply.code(404).send({ message: `Book not found` })
			return
		}

		books[index] = { id: parseInt(id, 10), title, author }
		saveBooks(books)

		reply.send(books[index])
	}
)

// PATCH: Частично обновить информацию о книге
fastify.patch(`/api/book/:id`, (request, reply) => {
	const { id } = request.params
	const updates = request.body
	const book = books.find(b => b.id === parseInt(id, 10))

	if (!book) {
		reply.code(404).send({ message: `Book not found` })
		return
	}

	Object.assign(book, updates)
	saveBooks(books)

	reply.send(book)
})

// DELETE: Удалить книгу по ID
fastify.delete(`/api/book/:id`, (request, reply) => {
	const { id } = request.params
	const index = books.findIndex(b => b.id === parseInt(id, 10))

	if (index !== -1) {
		books.splice(index, 1)
		saveBooks(books)

		reply.send({ message: `Book deleted successfully` })
	} else {
		reply.code(404).send({ message: `Book not found` })
	}
})

const start = async () => {
	try {
		await fastify.listen({ port: 8000 })
		console.log(`Server is running on port 8000`)
	} catch (e) {
		fastify.log.error(e)
		process.exit(1)
	}
}

start()
