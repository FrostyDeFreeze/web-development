import { AmpqProvider } from './ampq.service.js'

export class AuthService {
	static async register(username, password, email) {
		await AmpqProvider.sendEventToTheQueue(`greetings`, {
			username,
			password,
			email
		})
	}
}
