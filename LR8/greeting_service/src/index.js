import config from '../../config.js'
import { AmpqProvider } from '../../api/src/services/ampq.service.js'
import { Handler } from './mail/index.js'

await AmpqProvider.connect(config.ampq)
AmpqProvider.subscribeToEvent(`greetings`, Handler.createUserHandler)
