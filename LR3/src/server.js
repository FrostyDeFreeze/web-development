import http from 'node:http'
import url from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const __dirname = import.meta.dirname
const DATA_PATH = path.join(__dirname, `data/books.json`)

const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	NOT_FOUND: 404
}
const CONTENT_TYPE_JSON = { 'Content-Type': `application/json` }

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

const handleGetAllBooks = (req, res, query) => {
	const { limit, page } = query

	const pageSize = limit ? parseInt(limit, 10) : books.length
	const pageNum = page ? parseInt(page, 10) - 1 : 0
	const paginatedBooks = books.slice(pageNum * pageSize, (pageNum + 1) * pageSize)

	res.writeHead(HTTP_STATUS.OK, CONTENT_TYPE_JSON)
	res.end(JSON.stringify(paginatedBooks, null, 2))
}

const handleGetBookById = (req, res, id) => {
	const book = books.find(b => b.id === id)

	if (book) {
		res.writeHead(HTTP_STATUS.OK, CONTENT_TYPE_JSON)
		res.end(JSON.stringify(book, null, 2))
	} else {
		res.writeHead(HTTP_STATUS.NOT_FOUND, CONTENT_TYPE_JSON)
		res.end(JSON.stringify({ message: `Book not found` }, null, 2))
	}
}

const handlePostBook = (req, res, body) => {
	try {
		const { title, author } = JSON.parse(body)

		if (!title || !author) {
			throw new Error(`Missing title or author`)
		}

		const maxId = books.length > 0 ? Math.max(...books.map(book => book.id)) : 0
		const newBook = { id: maxId + 1, title, author }

		books.push(newBook)
		saveBooks(books)

		res.writeHead(HTTP_STATUS.CREATED, CONTENT_TYPE_JSON)
		res.end(JSON.stringify(newBook, null, 2))
	} catch (e) {
		res.writeHead(HTTP_STATUS.BAD_REQUEST, CONTENT_TYPE_JSON)
		res.end(JSON.stringify({ message: `Invalid request body` }, null, 2))
	}
}

const handlePutBook = (req, res, id, body) => {
	try {
		const { title, author } = JSON.parse(body)
		const index = books.findIndex(b => b.id === id)

		if (index === -1) {
			res.writeHead(HTTP_STATUS.NOT_FOUND, CONTENT_TYPE_JSON)
			res.end(JSON.stringify({ message: `Book not found` }, null, 2))
			return
		}

		books[index] = { id, title, author }
		saveBooks(books)

		res.writeHead(HTTP_STATUS.OK, CONTENT_TYPE_JSON)
		res.end(JSON.stringify(books[index], null, 2))
	} catch (e) {
		res.writeHead(HTTP_STATUS.BAD_REQUEST, CONTENT_TYPE_JSON)
		res.end(JSON.stringify({ message: `Invalid request body` }, null, 2))
	}
}

const handlePatchBook = (req, res, id, body) => {
	try {
		const updates = JSON.parse(body)
		const book = books.find(b => b.id === id)

		if (!book) {
			res.writeHead(HTTP_STATUS.NOT_FOUND, CONTENT_TYPE_JSON)
			res.end(JSON.stringify({ message: `Book not found` }, null, 2))
			return
		}

		Object.assign(book, updates)
		saveBooks(books)

		res.writeHead(HTTP_STATUS.OK, CONTENT_TYPE_JSON)
		res.end(JSON.stringify(book, null, 2))
	} catch (e) {
		res.writeHead(HTTP_STATUS.BAD_REQUEST, CONTENT_TYPE_JSON)
		res.end(JSON.stringify({ message: `Invalid request body` }, null, 2))
	}
}

const handleDeleteBook = (req, res, id) => {
	const index = books.findIndex(b => b.id === id)

	if (index !== -1) {
		books.splice(index, 1)
		saveBooks(books)

		res.writeHead(HTTP_STATUS.OK, CONTENT_TYPE_JSON)
		res.end(JSON.stringify({ message: `Book deleted successfully` }, null, 2))
	} else {
		res.writeHead(HTTP_STATUS.NOT_FOUND, CONTENT_TYPE_JSON)
		res.end(JSON.stringify({ message: `Book not found` }, null, 2))
	}
}

const server = http.createServer((req, res) => {
	let body = ``

	req.on(`data`, chunk => {
		body += chunk
	})

	req.on(`end`, () => {
		const parsedUrl = url.parse(req.url, true)
		const pathParts = parsedUrl.pathname.split(`/`)
		const id = pathParts.length > 3 ? parseInt(pathParts[3], 10) : null

		if (parsedUrl.pathname.startsWith(`/api/book`)) {
			switch (req.method) {
				case `GET`:
					if (id) {
						handleGetBookById(req, res, id)
					} else {
						handleGetAllBooks(req, res, parsedUrl.query)
					}
					break
				case `POST`:
					handlePostBook(req, res, body)
					break
				case `PUT`:
					handlePutBook(req, res, id, body)
					break
				case `PATCH`:
					handlePatchBook(req, res, id, body)
					break
				case `DELETE`:
					handleDeleteBook(req, res, id)
					break
				default:
					res.writeHead(HTTP_STATUS.NOT_FOUND, CONTENT_TYPE_JSON)
					res.end(JSON.stringify({ message: `Not found` }, null, 2))
			}
		} else {
			res.writeHead(HTTP_STATUS.NOT_FOUND, CONTENT_TYPE_JSON)
			res.end(JSON.stringify({ message: `Not found` }, null, 2))
		}
	})
})

server.listen(8000, () => {
	console.log(`Server is running on port 8000`)
})
