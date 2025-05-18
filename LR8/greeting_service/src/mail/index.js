import nodemailer from 'nodemailer'
import config from '../../../config.js'

export class Handler {
	static transporter = nodemailer.createTransport({
		host: `smtp.mail.ru`,
		port: 465,
		secure: true,
		auth: {
			user: config.mail.user,
			pass: config.mail.password
		}
	})

	static async createUserHandler(payload) {
		console.log(`CreateUserHandler see an event with payload:`, payload)

		try {
			await Handler.transporter.sendMail({
				from: `"Registration Service" <${config.mail.user}>`,
				to: payload.email,
				subject: `Спасибо за регистрацию!`,
				text: `${payload.username}, добро пожаловать!`,
				html: `<h1>Добро пожаловать, ${payload.username}!</h1><p>Рады вас видеть!</p>`
			})

			console.log(`Welcome email sent to ${payload.email}`)
		} catch (e) {
			console.error(`Error sending email:`, e)
		}
	}
}
