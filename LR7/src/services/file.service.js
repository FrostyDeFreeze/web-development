import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { File } from '../models/file.model.js'
import { PassThrough } from 'stream'
import path from 'node:path'

export class FileService {
	static client = new S3Client({
		region: `ru-rnd-1`,
		endpoint: `http://localhost:9000`,
		forcePathStyle: true,
		credentials: {
			accessKeyId: ``,
			secretAccessKey: ``
		}
	})

	static async saveFile(fileStream, fileName, mimetype) {
		try {
			const key = `${Math.random().toString(36).slice(2)}${path.extname(fileName)}`
			let totalSize = 0

			const passThrough = new PassThrough()
			fileStream.on(`data`, chunk => {
				totalSize += chunk.length
			})
			fileStream.pipe(passThrough)

			const params = {
				Body: passThrough,
				Bucket: `storage`,
				Key: key,
				ContentType: mimetype
			}

			const upload = new Upload({
				client: this.client,
				params,
				queueSize: 4,
				partSize: 1024 * 1024 * 5,
				leavePartsOnError: false
			})

			const uploadResult = await upload.done()
			console.log(`File uploaded successfully`, uploadResult)

			const file = await File.create({
				key,
				original_name: fileName,
				bucket: `storage`,
				mime_type: mimetype,
				size: totalSize
			})

			return { error: null, data: file }
		} catch (e) {
			console.error(e)
			return { error: e, data: null }
		}
	}

	static async getFile(fileId) {
		try {
			const file = await File.findByPk(fileId)
			if (!file) {
				return { error: `File not found`, data: null }
			}

			const command = new GetObjectCommand({
				Bucket: file.bucket,
				Key: file.key
			})

			const result = await this.client.send(command)
			return { error: null, data: { stream: result.Body, file } }
		} catch (e) {
			console.error(e)
			return { error: e, data: null }
		}
	}

	static async updateEntityId(fileId, entityId) {
		try {
			const file = await File.findByPk(fileId)
			if (!file) {
				return { error: `File not found`, data: null }
			}
			await file.update({ entity_id: entityId })
			return { error: null, data: file }
		} catch (e) {
			console.error(e)
			return { error: e, data: null }
		}
	}
}
