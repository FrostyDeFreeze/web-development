import amqplib from 'amqplib'
import { serialize, deserialize } from 'v8'

export class AmpqProvider {
	static channels = []

	static async connect(config) {
		this.connection = await amqplib.connect(config)
	}

	static async sendEventToTheQueue(queueName, payload) {
		let channel
		try {
			const existingChan = this.channels.find(chan => chan.queueName === queueName)
			if (!existingChan) {
				channel = await this.connection.createChannel()
				this.channels.push({ queueName, channel })
			} else {
				channel = existingChan.channel
			}

			console.info(`Sending information: ${JSON.stringify(payload)} to the queue: ${queueName}`)
			await channel.sendToQueue(queueName, serialize(payload))
			return { error: null, data: true }
		} catch (e) {
			console.error(e)
			return { error: e, data: null }
		}
	}

	static async subscribeToEvent(queueName, handler) {
		let channel
		try {
			const existingChan = this.channels.find(chan => chan.queueName === queueName)
			if (!existingChan) {
				channel = await this.connection.createChannel()
				this.channels.push({ queueName, channel, handler })
			} else {
				channel = existingChan.channel
			}

			await channel.assertQueue(queueName)
			channel.consume(queueName, msg => {
				if (msg !== null) {
					const payload = deserialize(msg.content)
					console.info(`Receiving information: ${JSON.stringify(payload)} from the queue: ${queueName}`)
					handler(payload)
					channel.ack(msg)
				} else {
					console.log(`Consumer cancelled by server`)
				}
			})
		} catch (e) {
			console.error(e)
			return { error: e, data: null }
		}
	}
}
