const { DateTime } = require(`luxon`)

const timeUntilNewYear = () => {
	const now = DateTime.now().setZone(`Europe/Moscow`)
	const newYear = DateTime.fromObject({ year: now.year + 1, month: 1, day: 1 }, { zone: `Europe/Moscow` })

	const duration = newYear.diff(now, [`days`, `hours`, `minutes`, `seconds`]).toObject()

	const units = {
		d: duration.days,
		h: duration.hours,
		m: duration.minutes,
		s: Math.floor(duration.seconds)
	}

	console.log(`До нового года осталось: ${units.d} дней, ${units.h} часов, ${units.m} минут, ${units.s} секунд 🎉`)
}

timeUntilNewYear()
