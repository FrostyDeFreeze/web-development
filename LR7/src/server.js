import Fastify from 'fastify'
import multipart from '@fastify/multipart'

import { init } from './config/database.js'
import { FileController } from './controllers/file.controller.js'
import { BookController } from './controllers/book.controller.js'

const fastify = Fastify({
	logger: true
})
fastify.register(multipart)

const PORT = 8000

// Книги
fastify.get(`/api/book`, BookController.getBooks)
fastify.get(`/api/book/:id`, BookController.getBook)
fastify.post(`/api/book`, BookController.createBook)
fastify.put(`/api/book/:id`, BookController.updateBook)
fastify.patch(`/api/book/:id`, BookController.updateBook)
fastify.delete(`/api/book/:id`, BookController.deleteBook)

// Файлы
fastify.post(`/api/files`, FileController.saveFile)
fastify.get(`/api/files/:fileId`, FileController.getFile)
fastify.get(`/api/files/:fileId/download`, FileController.downloadFile)

async function start() {
	try {
		await init()
		await fastify.listen({ port: PORT })
		console.log(`Server is running on port ${PORT}`)
	} catch (e) {
		fastify.log.error(e)
		process.exit(1)
	}
}

start()
