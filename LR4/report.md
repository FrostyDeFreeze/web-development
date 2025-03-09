### Отчёт по лабораторной работе: Построение HTTP сервера с использованием фреймворка Fastify

#### Цель работы

Целью лабораторной работы было ознакомление с фреймворком Fastify, изучение его механизмов работы с роутами и встроенными средствами валидации. В процессе выполнения задачи был реализован HTTP сервер для работы с книгами, поддерживающий операции CRUD (создание, чтение, обновление, удаление) с дополнительной функциональностью пагинации.

#### Реализация HTTP сервера

С помощью фреймворка Fastify был построен сервер для управления коллекцией книг. В основе сервера лежит работа с файлами JSON для хранения данных, а также использование Fastify для обработки HTTP запросов. Все основные действия, такие как добавление, удаление, обновление и получение информации о книгах, были реализованы с использованием маршрутов Fastify.

#### Описание работы сервера

1. **Загрузка и сохранение данных**
   Для работы с данными используется файл `books.json`, в котором хранится список книг в формате JSON. Функции `loadBooks` и `saveBooks` отвечают за загрузку и сохранение данных в этот файл. Все данные о книгах загружаются в память при старте сервера, что позволяет работать с ними без постоянных обращений к файлу.

2. **Роуты сервера**
   Сервер поддерживает следующие маршруты для работы с книгами:

    - **GET /api/book** — Получить список всех книг с поддержкой пагинации. Параметры запроса `limit` и `page` позволяют ограничить количество возвращаемых книг и задать страницу.

    - **GET /api/book/:id** — Получить информацию о книге по её ID. В случае, если книга с указанным ID не найдена, возвращается ошибка 404.

    - **POST /api/book** — Добавить новую книгу. Для добавления книги используется схема данных, в которой обязательно должны быть указаны `title` (название книги) и `author` (автор). Новая книга добавляется в коллекцию, и данные сохраняются в файл.

    - **PUT /api/book/:id** — Обновить всю информацию о книге. Этот запрос заменяет старую информацию о книге новой, указанной в теле запроса.

    - **PATCH /api/book/:id** — Частично обновить информацию о книге. Данный запрос позволяет обновить только те поля книги, которые были указаны в теле запроса.

    - **DELETE /api/book/:id** — Удалить книгу по её ID. В случае успеха возвращается сообщение о том, что книга была удалена.

3. **Валидация данных**
   Для проверки корректности данных при создании и обновлении книг используется схема валидации, которая определяет обязательные поля и их типы. В частности, для запросов `POST` и `PUT` используется схема `bookSchema`, которая требует наличия полей `title` и `author`, оба типа данных должны быть строками.

4. **Запуск сервера**
   Для запуска сервера используется метод `fastify.listen()`, который запускает сервер на порту 8000. При успешном запуске сервер выводит сообщение о том, что он работает.

#### Код

Пример кода, реализующего HTTP сервер с использованием Fastify:

```javascript
import Fastify from 'fastify'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = import.meta.dirname
const DATA_PATH = path.join(__dirname, `data/books.json`)

// Функции для загрузки и сохранения данных
const loadBooks = () => {
	try {
		return JSON.parse(fs.readFileSync(DATA_PATH, `utf8`))
	} catch (e) {
		return []
	}
}

const saveBooks = books => {
	fs.writeFileSync(DATA_PATH, JSON.stringify(books, null, 2), `utf8`)
}

let books = loadBooks()

// Инициализация Fastify
const fastify = Fastify({ logger: true })

// Схема для валидации данных о книге
const bookSchema = {
	type: `object`,
	required: [`title`, `author`],
	properties: {
		title: { type: `string` },
		author: { type: `string` }
	}
}

// Роуты сервера

fastify.get(
	'/api/book',
	{
		schema: {
			querystring: {
				type: `object`,
				properties: {
					limit: { type: `number`, default: 10 },
					page: { type: `number`, default: 1 }
				}
			}
		}
	},
	(request, reply) => {
		const { limit, page } = request.query
		const pageSize = limit
		const pageNum = page - 1
		const paginatedBooks = books.slice(pageNum * pageSize, (pageNum + 1) * pageSize)

		reply.send(paginatedBooks)
	}
)

fastify.get('/api/book/:id', (request, reply) => {
	const { id } = request.params
	const book = books.find(b => b.id === parseInt(id, 10))

	if (book) {
		reply.send(book)
	} else {
		reply.code(404).send({ message: `Book not found` })
	}
})

fastify.post(
	'/api/book',
	{
		schema: {
			body: bookSchema
		}
	},
	(request, reply) => {
		const { title, author } = request.body
		const maxId = books.length > 0 ? Math.max(...books.map(book => book.id)) : 0
		const newBook = { id: maxId + 1, title, author }

		books.push(newBook)
		saveBooks(books)

		reply.code(201).send(newBook)
	}
)

fastify.put(
	'/api/book/:id',
	{
		schema: {
			body: bookSchema
		}
	},
	(request, reply) => {
		const { id } = request.params
		const { title, author } = request.body
		const index = books.findIndex(b => b.id === parseInt(id, 10))

		if (index === -1) {
			reply.code(404).send({ message: `Book not found` })
			return
		}

		books[index] = { id: parseInt(id, 10), title, author }
		saveBooks(books)

		reply.send(books[index])
	}
)

fastify.patch('/api/book/:id', (request, reply) => {
	const { id } = request.params
	const updates = request.body
	const book = books.find(b => b.id === parseInt(id, 10))

	if (!book) {
		reply.code(404).send({ message: `Book not found` })
		return
	}

	Object.assign(book, updates)
	saveBooks(books)

	reply.send(book)
})

fastify.delete('/api/book/:id', (request, reply) => {
	const { id } = request.params
	const index = books.findIndex(b => b.id === parseInt(id, 10))

	if (index !== -1) {
		books.splice(index, 1)
		saveBooks(books)

		reply.send({ message: `Book deleted successfully` })
	} else {
		reply.code(404).send({ message: `Book not found` })
	}
})

// Запуск сервера
const start = async () => {
	try {
		await fastify.listen({ port: 8000 })
		console.log(`Server is running on port 8000`)
	} catch (e) {
		fastify.log.error(e)
		process.exit(1)
	}
}

start()
```

#### Выводы

В результате выполнения лабораторной работы был построен HTTP сервер с использованием фреймворка Fastify. Реализованы основные операции для работы с книгами, включая их создание, обновление, удаление и пагинацию. Также была настроена валидация данных для добавляемых и обновляемых книг. Работа с сервером показала удобство и высокую производительность Fastify, что делает его хорошим выбором для разработки RESTful API.
