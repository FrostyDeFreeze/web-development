import { BookService } from '../services/book.service.js'

export class BookController {
	static async getBooks(request, reply) {
		const { limit, page } = request.query
		const { error, data } = await BookService.getBooks(limit, page)

		if (error) {
			reply.code(500)
			return { error: `Internal server error` }
		}

		return { books: data.books, total: data.total }
	}

	static async getBook(request, reply) {
		const { id } = request.params
		const { error, data } = await BookService.getBook(id)

		if (error) {
			reply.code(404)
			return { message: `Book not found` }
		}

		return data
	}

	static async createBook(request, reply) {
		const { error, data } = await BookService.createBook(request.body)

		if (error) {
			reply.code(500)
			return { error: `Internal server error` }
		}

		reply.code(201)
		return data
	}

	static async updateBook(request, reply) {
		const { id } = request.params
		const { error, data } = await BookService.updateBook(id, request.body)

		if (error) {
			reply.code(404)
			return { message: `Book not found` }
		}

		return data
	}

	static async deleteBook(request, reply) {
		const { id } = request.params
		const { error, data } = await BookService.deleteBook(id)

		if (error) {
			reply.code(404)
			return { message: `Book not found` }
		}

		return data
	}
}
