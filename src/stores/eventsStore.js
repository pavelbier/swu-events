import { defineStore } from 'pinia'
import dayjs from '@/dayjs'

// GitHub konfigurace - uprav podle svého repozitáře
const GITHUB_OWNER = 'pavelbier'
const GITHUB_REPO = 'swu-events'
const GITHUB_BRANCH = 'main'
const EVENTS_PATH = 'src/data/events'

// Pro DEV režim - načíst lokální JSON soubory
const localEventFiles = import.meta.glob('@/data/events/*.json', { eager: true })

function loadEventsFromLocal() {
  return Object.values(localEventFiles).flatMap(module => module.default)
}

// Pomocné funkce pro práci s URL
function getUrlParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    date: params.get('date'),
    types: params.get('types'),
    distance: params.get('distance'),
    lat: params.get('lat'),
    lng: params.get('lng')
  }
}

function updateUrl(state) {
  const params = new URLSearchParams()

  // Datum přidej jen pokud není dnešní
  const today = dayjs().format('YYYY-MM-DD')
  if (state.selectedDate !== today) {
    params.set('date', state.selectedDate)
  }

  // Typy přidej jen pokud nejsou výchozí
  const defaultTypes = ['weekly', 'showdown', 'prerelease', 'tournament']
  const typesChanged = state.selectedTypes.length !== defaultTypes.length ||
    !state.selectedTypes.every(t => defaultTypes.includes(t))
  if (typesChanged) {
    params.set('types', state.selectedTypes.join(','))
  }

  // Vzdálenost přidej jen pokud není výchozí
  if (state.maxDistance !== 300) {
    params.set('distance', state.maxDistance.toString())
  }

  // Pozice mapy - přidej jen pokud není výchozí (střed ČR)
  const defaultLat = 49.8175
  const defaultLng = 15.4730
  if (Math.abs(state.mapCenter.lat - defaultLat) > 0.01 || Math.abs(state.mapCenter.lng - defaultLng) > 0.01) {
    params.set('lat', state.mapCenter.lat.toFixed(4))
    params.set('lng', state.mapCenter.lng.toFixed(4))
  }

  const query = params.toString()
  const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname
  window.history.replaceState({}, '', newUrl)
}

// Funkce pro načtení seznamu JSON souborů z GitHub API
async function fetchEventFilesFromGitHub() {
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${EVENTS_PATH}?ref=${GITHUB_BRANCH}`

  const response = await fetch(apiUrl)
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  const files = await response.json()
  return files.filter(f => f.name.endsWith('.json'))
}

// Funkce pro načtení obsahu JSON souboru z GitHubu
async function fetchJsonFile(filename) {
  const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${EVENTS_PATH}/${filename}`

  const response = await fetch(rawUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename}: ${response.status}`)
  }

  return response.json()
}

// Funkce pro načtení všech událostí z GitHubu
async function loadEventsFromGitHub() {
  const files = await fetchEventFilesFromGitHub()
  const allEvents = []

  for (const file of files) {
    const events = await fetchJsonFile(file.name)
    if (Array.isArray(events)) {
      allEvents.push(...events)
    } else {
      allEvents.push(events)
    }
  }

  return allEvents
}

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
    const { startDate, endDate, frequency, duration, excludeDates = [], dateOverrides = {} } = event.recurrence
    let currentDate = dayjs(startDate)
    const finalDate = dayjs(endDate)
    const excludeSet = new Set(excludeDates.map(d => dayjs(d).format('YYYY-MM-DD')))

    while (currentDate.isBefore(finalDate) || currentDate.isSame(finalDate, 'day')) {
      const dateStr = currentDate.format('YYYY-MM-DD')

      // Přeskočit vyloučená data
      if (!excludeSet.has(dateStr)) {
        const eventStart = currentDate.format('YYYY-MM-DDTHH:mm')
        const eventEnd = currentDate.add(duration, 'hour').format('YYYY-MM-DDTHH:mm')

        // Získat případné přepsání pro toto datum
        const override = dateOverrides[dateStr] || {}

        expandedEvents.push({
          id: idCounter++,
          title: override.title || event.title,
          type: event.type,
          dateFrom: eventStart,
          dateTo: eventEnd,
          location: event.location,
          url: override.url || event.url,
          description: override.description || null
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

export const useEventsStore = defineStore('events', {
  state: () => {
    const urlParams = getUrlParams()

    // Datum: URL > dnešek
    const selectedDate = urlParams.date || dayjs().format('YYYY-MM-DD')

    // Vzdálenost: URL > localStorage > default
    const savedDistance = localStorage.getItem('maxDistance')
    const maxDistance = urlParams.distance
      ? parseInt(urlParams.distance, 10)
      : (savedDistance ? parseInt(savedDistance, 10) : 300)

    // Typy: URL > localStorage > default
    const savedTypes = localStorage.getItem('selectedTypes')
    const defaultTypes = ['weekly', 'showdown', 'prerelease', 'tournament']
    const selectedTypes = urlParams.types
      ? urlParams.types.split(',').filter(t => t)
      : (savedTypes ? JSON.parse(savedTypes) : defaultTypes)

    // Pozice mapy: URL > default (střed ČR)
    const defaultLat = 49.8175
    const defaultLng = 15.4730
    const mapCenter = {
      lat: urlParams.lat ? parseFloat(urlParams.lat) : defaultLat,
      lng: urlParams.lng ? parseFloat(urlParams.lng) : defaultLng
    }

    return {
      events: [],
      isLoading: true,
      loadError: null,
      selectedDate,
      mapCenter,
      zoom: 8,
      maxDistance,
      selectedTypes,
      selectedEvent: null,
      hoveredEvent: null,
      maxDisplayEvents: 5
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
      const max = state.maxDisplayEvents

      // Pokud máme dost akcí na daný den, vrátit je
      if (filtered.length >= max) {
        return filtered
      }

      // Doplnit nejbližšími akcemi do maxDisplayEvents
      let result = [...filtered]

      if (result.length < max) {
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
          .slice(0, max - result.length)

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
    async loadEvents() {
      this.isLoading = true
      this.loadError = null

      try {
        let rawEvents

        if (import.meta.env.DEV) {
          // DEV režim - načíst z lokálních souborů
          rawEvents = loadEventsFromLocal()
          console.log('Načítám události z lokálních souborů (DEV)')
        } else {
          // PROD režim - načíst z GitHubu
          rawEvents = await loadEventsFromGitHub()
          console.log('Načítám události z GitHubu (PROD)')
        }

        this.events = expandRecurringEvents(rawEvents)
      } catch (error) {
        console.error('Chyba při načítání událostí:', error)
        this.loadError = error.message
      } finally {
        this.isLoading = false
      }
    },
    setDate(date) {
      this.selectedDate = date
      updateUrl(this)
    },
    setMaxDistance(distance) {
      this.maxDistance = distance
      localStorage.setItem('maxDistance', distance.toString())
      updateUrl(this)
    },
    setSelectedTypes(types) {
      this.selectedTypes = types
      localStorage.setItem('selectedTypes', JSON.stringify(types))
      updateUrl(this)
    },
    selectEvent(event) {
      this.selectedEvent = event
      if (event) {
        // Přesunout datum na den vybrané akce
        const eventDate = dayjs(event.dateFrom).format('YYYY-MM-DD')
        if (this.selectedDate !== eventDate) {
          this.selectedDate = eventDate
          updateUrl(this)
        }
      }
    },
    setHoveredEvent(event) {
      this.hoveredEvent = event
    },
    setMapCenter(center) {
      this.mapCenter = center
      updateUrl(this)
    },
    resetToToday() {
      this.selectedDate = dayjs().format('YYYY-MM-DD')
      this.selectedEvent = null
      this.hoveredEvent = null
      updateUrl(this)
    }
  }
})
