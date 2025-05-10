import { Book } from '../models/book.model.js'
import { File } from '../models/file.model.js'
import { FileService } from './file.service.js'

export class BookService {
	static transformBookData(book) {
		const bookData = { ...book.toJSON() }
		delete bookData.cover
		delete bookData.coverId

		if (book.cover) {
			bookData.cover = {
				url: `http://localhost:8000/api/files/${book.cover.id}`,
				download: `http://localhost:8000/api/files/${book.cover.id}/download`
			}
		} else {
			bookData.cover = null
		}

		return bookData
	}

	static async getBooks(limit = 10, page = 1) {
		try {
			const offset = (page - 1) * limit
			const { rows: books, count } = await Book.findAndCountAll({
				include: [{ model: File, as: `cover` }],
				limit,
				offset
			})
			return {
				error: null,
				data: {
					books: books.map(book => this.transformBookData(book)),
					total: count
				}
			}
		} catch (e) {
			return { error: e, data: null }
		}
	}

	static async getBook(id) {
		try {
			const book = await Book.findByPk(id, {
				include: [{ model: File, as: `cover` }]
			})
			if (!book) {
				return { error: `Book not found`, data: null }
			}
			return { error: null, data: this.transformBookData(book) }
		} catch (e) {
			return { error: e, data: null }
		}
	}

	static async createBook(bookData) {
		try {
			const book = await Book.create(bookData)
			if (bookData.coverId) {
				await FileService.updateEntityId(bookData.coverId, book.id)
			}
			return this.getBook(book.id)
		} catch (e) {
			return { error: e, data: null }
		}
	}

	static async updateBook(id, bookData) {
		try {
			const book = await Book.findByPk(id)
			if (!book) {
				return { error: `Book not found`, data: null }
			}
			if (bookData.coverId) {
				await FileService.updateEntityId(bookData.coverId, id)
			}
			await book.update(bookData)
			return this.getBook(id)
		} catch (e) {
			return { error: e, data: null }
		}
	}

	static async deleteBook(id) {
		try {
			const book = await Book.findByPk(id)
			if (!book) {
				return { error: `Book not found`, data: null }
			}
			await book.destroy()
			return { error: null, data: { message: `Book deleted successfully` } }
		} catch (e) {
			return { error: e, data: null }
		}
	}
}
