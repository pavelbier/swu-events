import { defineStore } from 'pinia'
import dayjs from '@/dayjs'

// Načíst všechny JSON soubory z adresáře events
const eventFiles = import.meta.glob('@/data/events/*.json', { eager: true })

// Spojit všechna data do jednoho pole
const events = Object.values(eventFiles).flatMap(module => module.default)

function distance(lat1, lng1, lat2, lng2) {
  const toRad = deg => (deg * Math.PI) / 180
  const R = 6371 // km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
};

// Funkce pro expandování opakujících se událostí
function expandRecurringEvents(events) {
  const expandedEvents = []
  let idCounter = 1

  events.forEach(event => {
    // Pokud událost nemá recurrence, přidej ji tak jak je
    if (!event.recurrence) {
      expandedEvents.push({
        ...event,
        id: event.id || idCounter++
      })
      return
    }

    // Expanduj opakující se událost
    const { startDate, endDate, frequency, duration, excludeDates = [] } = event.recurrence
    let currentDate = dayjs(startDate)
    const finalDate = dayjs(endDate)
    const excludeSet = new Set(excludeDates.map(d => dayjs(d).format('YYYY-MM-DD')))

    while (currentDate.isBefore(finalDate) || currentDate.isSame(finalDate, 'day')) {
      const dateStr = currentDate.format('YYYY-MM-DD')

      // Přeskočit vyloučená data
      if (!excludeSet.has(dateStr)) {
        const eventStart = currentDate.format('YYYY-MM-DDTHH:mm')
        const eventEnd = currentDate.add(duration, 'hour').format('YYYY-MM-DDTHH:mm')

        expandedEvents.push({
          id: idCounter++,
          title: event.title,
          type: event.type,
          dateFrom: eventStart,
          dateTo: eventEnd,
          location: event.location,
          url: event.url
        })
      }

      // Přidat interval podle frekvence
      if (frequency === 'daily') {
        currentDate = currentDate.add(1, 'day')
      } else if (frequency === 'weekly') {
        currentDate = currentDate.add(1, 'week')
      } else if (frequency === 'monthly') {
        currentDate = currentDate.add(1, 'month')
      }
    }
  })

  return expandedEvents
}

// Expanduj události při načtení
const expandedEvents = expandRecurringEvents(events)

export const useEventsStore = defineStore('events', {
  state: () => {
    // Načíst maxDistance z localStorage
    const savedDistance = localStorage.getItem('maxDistance')
    const maxDistance = savedDistance ? parseInt(savedDistance, 10) : 300

    // Načíst selectedTypes z localStorage
    const savedTypes = localStorage.getItem('selectedTypes')
    const selectedTypes = savedTypes ? JSON.parse(savedTypes) : ['weekly', 'showdown', 'prerelease', 'tournament']

    return {
      events: expandedEvents,
      selectedDate: dayjs().format('YYYY-MM-DD'),
      mapCenter: { lat: 49.8175, lng: 15.4730 }, // střed ČR
      zoom: 8,
      maxDistance: maxDistance,
      selectedTypes: selectedTypes,
      selectedEvent: null,
      hoveredEvent: null
    }
  },

  getters: {
    filteredEvents(state) {
      // filtr podle vybraného dne
      const filtered = state.events.filter(e =>
        dayjs(state.selectedDate).isBetween(
          dayjs(e.dateFrom),
          dayjs(e.dateTo),
          'day',
          '[]'
        ) && state.selectedTypes.includes(e.type)
      )

      // seřadit podle vzdálenosti od středu mapy
      return filtered
        .map(e => ({
          ...e,
          distance: distance(
            state.mapCenter.lat,
            state.mapCenter.lng,
            e.location.lat,
            e.location.lng
          )
        }))
        .sort((a, b) => a.distance - b.distance)
    },

    displayedEvents(state) {
      const filtered = this.filteredEvents

      // Pokud máme 5 nebo více akcí na daný den, vrátit je
      if (filtered.length >= 5) {
        return filtered
      }

      // Pokud máme méně než 5 akcí, doplnit nejbližšími akcemi do 5
      let result = [...filtered]
      
      if (result.length < 5) {
        const nearestEvents = state.events
          .filter(e => {
            const dist = distance(
              state.mapCenter.lat,
              state.mapCenter.lng,
              e.location.lat,
              e.location.lng
            )
            const isAfterOrSameAsSelected = !dayjs(e.dateFrom).isBefore(dayjs(state.selectedDate), 'day')
            return dist <= state.maxDistance && state.selectedTypes.includes(e.type) && !result.some(r => r.id === e.id) && isAfterOrSameAsSelected
          })
          .map(e => ({
            ...e,
            distance: distance(
              state.mapCenter.lat,
              state.mapCenter.lng,
              e.location.lat,
              e.location.lng
            ),
            daysFromNow: dayjs(e.dateFrom).diff(dayjs(state.selectedDate), 'day')
          }))
          .sort((a, b) => Math.abs(a.daysFromNow) - Math.abs(b.daysFromNow))
          .slice(0, 5 - result.length)
        
        result = [...result, ...nearestEvents]
      }

      return result
    },

    availableTypes(state) {
      const types = [...new Set(state.events.map(e => e.type))].sort()
      return types
    }
  },
  actions: {
    setDate(date) {
      this.selectedDate = date
    },
    setMaxDistance(distance) {
      this.maxDistance = distance
      localStorage.setItem('maxDistance', distance.toString())
    },
    setSelectedTypes(types) {
      this.selectedTypes = types
      localStorage.setItem('selectedTypes', JSON.stringify(types))
    },
    selectEvent(event) {
      this.selectedEvent = event
    },
    setHoveredEvent(event) {
      this.hoveredEvent = event
    },
    resetToToday() {
      this.selectedDate = dayjs().format('YYYY-MM-DD')
      this.selectedEvent = null
      this.hoveredEvent = null
    }
  }
})
