import { FileService } from '../services/file.service.js'

export class FileController {
	static async saveFile(request, reply) {
		const data = await request.file()
		const { error, data: file } = await FileService.saveFile(data.file, data.filename, data.mimetype)

		if (error) {
			reply.code(500)
			return { message: `Internal server error` }
		}

		return {
			id: file.id,
			key: file.key,
			size: file.size,
			mime_type: file.mime_type,
			url: `http://localhost:8000/api/files/${file.id}`
		}
	}

	static async getFile(request, reply) {
		const { fileId } = request.params
		const { error, data } = await FileService.getFile(fileId)

		if (error) {
			reply.code(404)
			return { message: `File not found` }
		}

		reply.header(`Content-Type`, data.file.mime_type)
		return data.stream
	}

	static async downloadFile(request, reply) {
		const { fileId } = request.params
		const { error, data } = await FileService.getFile(fileId)

		if (error) {
			reply.code(404)
			return { message: `File not found` }
		}

		reply.header(`Content-Type`, data.file.mime_type)
		reply.header(`Content-Disposition`, `attachment; filename="${data.file.original_name}"`)
		return data.stream
	}
}
