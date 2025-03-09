# Отчёт по лабораторной работе

## Тема: Знакомство с Node HTTP Module на примере реализации RESTful сервера

### Цель работы:

Познакомиться с HTTP модулем Node.js и реализовать HTTP сервер средствами Node.js без использования сторонних фреймворков.

### Введение:

Node.js — это среда выполнения для JavaScript, построенная на движке V8 от Google, которая позволяет запускать JavaScript на сервере. В рамках лабораторной работы использовался модуль `http`, который предоставляет функционал для работы с HTTP-сервером. Этот модуль позволяет создавать сервер, обрабатывать запросы и отправлять ответы. Мы реализовали простой RESTful сервер, который управляет списком книг: позволяет получить список книг, добавить, обновить, частично обновить и удалить книгу.

### Задачи:

1. Изучить и применить модуль `http` для создания простого HTTP-сервера.
2. Реализовать RESTful API для управления данными о книгах.
3. Реализовать обработку различных типов HTTP-запросов: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
4. Организовать работу с файловой системой для хранения данных о книгах.

### Ход работы:

#### 1. Создание HTTP сервера

Для создания HTTP сервера был использован модуль `http`, встроенный в Node.js. Сервер слушает запросы на порту 8000 и обрабатывает их в зависимости от метода HTTP и пути запроса. В качестве данных используется файл `data/books.json`, в котором хранится список книг.

```js
const server = http.createServer((req, res) => {
	let body = ``

	req.on(`data`, chunk => {
		body += chunk
	})

	req.on(`end`, () => {
		const parsedUrl = url.parse(req.url, true)
		const pathParts = parsedUrl.pathname.split(`/`)
		const id = pathParts.length > 3 ? parseInt(pathParts[3], 10) : null

		if (parsedUrl.pathname.startsWith(`/api/book`)) {
			// Обработка разных HTTP методов
		} else {
			res.writeHead(HTTP_STATUS.NOT_FOUND, CONTENT_TYPE_JSON)
			res.end(JSON.stringify({ message: `Not found` }, null, 2))
		}
	})
})

server.listen(8000, () => {
	console.log(`Server is running on port 8000`)
})
```

#### 2. Реализация обработчиков для различных HTTP методов

Для работы с книгами реализованы следующие обработчики:

-   **GET /api/book** — возвращает список всех книг с пагинацией.
-   **GET /api/book/{id}** — возвращает информацию о книге по ID.
-   **POST /api/book** — добавляет новую книгу в список.
-   **PUT /api/book/{id}** — обновляет всю информацию о книге.
-   **PATCH /api/book/{id}** — частично обновляет информацию о книге.
-   **DELETE /api/book/{id}** — удаляет книгу по ID.

Пример обработчика для получения списка всех книг с пагинацией:

```js
const handleGetAllBooks = (req, res, query) => {
	const { limit, page } = query

	const pageSize = limit ? parseInt(limit, 10) : books.length
	const pageNum = page ? parseInt(page, 10) - 1 : 0
	const paginatedBooks = books.slice(pageNum * pageSize, (pageNum + 1) * pageSize)

	res.writeHead(HTTP_STATUS.OK, CONTENT_TYPE_JSON)
	res.end(JSON.stringify(paginatedBooks, null, 2))
}
```

#### 3. Работа с файлами

Для хранения данных о книгах используется файл `data/books.json`. Для этого были реализованы две функции: `loadBooks` для загрузки данных из файла и `saveBooks` для сохранения данных обратно в файл.

```js
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
```

#### 4. Обработка ошибок

Каждый обработчик включает проверки на ошибки, такие как отсутствие обязательных полей в теле запроса или попытки обновить или удалить несуществующую книгу. В случае ошибки возвращается ответ с соответствующим кодом состояния и сообщением.

Пример обработки ошибки для добавления новой книги:

```js
const handlePostBook = (req, res, body) => {
	try {
		const { title, author } = JSON.parse(body)

		if (!title || !author) {
			throw new Error(`Missing title or author`)
		}

		const maxId = books.length > 0 ? Math.max(...books.map(book => book.id)) : 0
		const newBook = { id: maxId + 1, title, author }

		books.push(newBook)
		saveBooks(books)

		res.writeHead(HTTP_STATUS.CREATED, CONTENT_TYPE_JSON)
		res.end(JSON.stringify(newBook, null, 2))
	} catch (e) {
		res.writeHead(HTTP_STATUS.BAD_REQUEST, CONTENT_TYPE_JSON)
		res.end(JSON.stringify({ message: `Invalid request body` }, null, 2))
	}
}
```

### Результаты работы:

В результате выполнения работы был создан простой RESTful сервер на Node.js с использованием модуля `http`. Сервер позволяет выполнять следующие операции с данными о книгах:

1. Получение списка книг.
2. Получение книги по ID.
3. Добавление новой книги.
4. Обновление информации о книге.
5. Частичное обновление информации о книге.
6. Удаление книги по ID.

Все данные о книгах хранятся в файле `data/books.json`.

### Заключение:

В ходе выполнения лабораторной работы было изучено использование встроенного модуля `http` в Node.js для создания простого веб-сервера. Реализация RESTful API без сторонних фреймворков позволила глубже понять работу с HTTP запросами, а также работу с файловой системой для хранения данных.
