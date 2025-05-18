import Fastify from 'fastify'
import config from '../../config.js'
import { AuthController } from './controllers/auth.contoller.js'
import { AmpqProvider } from './services/ampq.service.js'

const fastify = Fastify({
	logger: true
})

fastify.post(`/register`, AuthController.register)

try {
	await AmpqProvider.connect(config.ampq)
	await fastify.listen({ port: 3000 })
} catch (e) {
	fastify.log.error(e)
	process.exit(1)
}
