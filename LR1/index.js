const secsConverter = function (input) {
	if (typeof input !== `number` || input < 0) {
		throw new Error(`Входное значение должно быть положительным числом`)
	}

	let remainder

	const y = 31_536_000
	const d = 86_400
	const h = 3_600
	const m = 60

	this.г = (input / y) | 0
	this.д = ((remainder = input - y * this.г) / d) | 0
	this.ч = ((remainder -= d * this.д) / h) | 0
	this.м = ((remainder -= h * this.ч) / m) | 0
	this.с = (remainder -= m * this.м) | 0
}

const convertToSecs = input => {
	if (typeof input === `number`) {
		return input > 1_000_000_000_000 ? Math.floor(input / 1_000) : input
	} else if (typeof input === `string` || input instanceof Date) {
		const date = new Date(input)

		if (!isNaN(date)) {
			return Math.floor(date.getTime() / 1_000)
		} else {
			throw new Error(`Неверный формат даты`)
		}
	}

	throw new Error(`Неверный формат входного значения для преобразования времени`)
}

const humanizer = (input, options = {}) => {
	const seconds = convertToSecs(input)
	const converted = new secsConverter(seconds)

	const { units = [`г`, `д`, `ч`, `м`, `с`], delimiter = `, `, precision = units.length } = options

	let out = ``
	let i = 0

	for (const field of units) {
		if (converted[field]) {
			out += (out.length ? delimiter : ``) + converted[field] + field

			if (++i === precision) {
				break
			}
		}
	}

	return out || `0с`
}

const getTimeToNewYear = () => {
	const mskDate = new Date().toLocaleString(`en-US`, { timeZone: `Europe/Moscow` })
	const now = new Date(mskDate).getTime() / 1000

	const nextYear = new Date(mskDate).getFullYear() + 1
	const newYearTimestamp = new Date(`${nextYear}-01-01T00:00:00+03:00`).getTime() / 1000

	console.info(`До нового года осталось: ${humanizer(newYearTimestamp - now)} 🎉`)
}

getTimeToNewYear()

const timeToNewYear = () => {
	const mskDate = new Date().toLocaleString(`en-US`, { timeZone: `Europe/Moscow` })
	const now = new Date(mskDate)

	const nextYear = now.getFullYear() + 1
	const newYearDate = new Date(`${nextYear}-01-01T00:00:00+03:00`)

	const diff = newYearDate - now

	const units = {
		d: Math.floor(diff / (1000 * 60 * 60 * 24)),
		h: Math.floor((diff / (1000 * 60 * 60)) % 24),
		m: Math.floor((diff / (1000 * 60)) % 60),
		s: Math.floor((diff / 1000) % 60)
	}

	console.info(`До нового года осталось: ${units.d} дней, ${units.h} часов, ${units.m} минут, ${units.s} секунд 🎉`)
}

getTimeToNewYear()
