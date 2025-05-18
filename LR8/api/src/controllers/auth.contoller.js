import { AuthService } from '../services/auth.service.js'

export class AuthController {
	static async register(request, reply) {
		const { username, password, email } = request.body
		if (!username || !password || !email) {
			return reply.code(400).send({ error: `Username, password and email are required` })
		}

		await AuthService.register(username, password, email)
		return { data: `Alright` }
	}
}
