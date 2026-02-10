<template>
  <div class="panel">
    <h3 v-if="store.filteredEvents.length > 0">{{ eventsHeading }}</h3>

    <div class="events-section">
      <div v-if="store.isLoading" class="loading">
        Načítám události...
      </div>

      <div v-else-if="store.loadError" class="error">
        Chyba při načítání: {{ store.loadError }}
        <button @click="store.loadEvents()">Zkusit znovu</button>
      </div>

      <div v-else-if="!store.displayedEvents.length" class="no-events">
        Žádné akce pro tento den a ani další dny v zadaném dosahu {{ store.maxDistance }} km.
      </div>

      <template v-for="(e, index) in store.displayedEvents" :key="e.id">
        <div v-if="index === store.filteredEvents.length" class="nearby-label">
          Nejbližší akce po dni {{ dayjs(store.selectedDate).format('D.M.') }} do {{ store.maxDistance }} km:
        </div>

        <div
          class="event-card"
          :class="{
            'on-selected-day': isOnSelectedDay(e),
            'selected': store.selectedEvent?.id === e.id,
            'hovered': store.hoveredEvent?.id === e.id
          }"
          :style="{ opacity: getEventOpacity(e) }"
          @click="store.selectEvent(e)"
          @mouseenter="store.setHoveredEvent(e)"
          @mouseleave="store.setHoveredEvent(null)"
        >
        <div class="header">
          <span class="title">{{ e.title }}</span>
          <span class="type" :class="e.type">{{ getTypeLabel(e.type) }}</span>
        </div>

        <div v-if="e.description" class="event-description">
          {{ e.description }}
        </div>

        <div v-if="e.url" class="event-url">
          <a :href="e.url" target="_blank" rel="noopener noreferrer">{{ e.url }}</a>
        </div>

        <div class="location">
          📍 {{ e.location.place }}, {{ e.location.city }}
        </div>
        <div class="distance">
          📍 {{ Math.round(e.distance) }} km
        </div>

        <div class="time">
          ⏰ {{ format(e.dateFrom) }} – {{ formatEnd(e.dateFrom, e.dateTo) }}
          <span class="days-from-now">({{ daysText(e.dateFrom) }})</span>
        </div>

      </div>
      </template>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from '@/dayjs'
import { useEventsStore } from '@/stores/eventsStore'

const store = useEventsStore()

const eventsHeading = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  if (store.selectedDate === today) {
    return 'Dnešní SWU akce'
  }
  return `SWU akce dne ${dayjs(store.selectedDate).format('D.M.YYYY')}`
})
const format = d => dayjs(d).format('dd D.M. HH:mm')
const formatEnd = (dateFrom, dateTo) => {
  const from = dayjs(dateFrom)
  const to = dayjs(dateTo)
  // Pokud je stejný den, zobraz jen čas
  if (from.isSame(to, 'day')) {
    return to.format('HH:mm')
  }
  // Jinak celé datum
  return to.format('dd D.M. HH:mm')
}

const typeLabels = {
  'weekly': 'weekly',
  'showdown': 'showdown',
  'prerelease': 'prerelease',
  'planetary': 'planetary',
  'tournament': 'turnaj'
}

const getTypeLabel = (type) => typeLabels[type] || type

const daysText = (eventDate) => {
  const diff = dayjs(eventDate).startOf('day').diff(dayjs().startOf('day'), 'day')
  if (diff === 0) return 'dnes'
  if (diff === 1) return 'za 1 den'
  if (diff < 5) return `za ${diff} dny`
  return `za ${diff} dní`
}

const isOnSelectedDay = (event) => {
  const isOnDay = store.filteredEvents.some(e => e.id === event.id)
  if (!isOnDay) return false

  // Zvýraznit pouze pokud splňuje filtr dosahu
  return event.distance <= store.maxDistance
}

const getEventOpacity = (event) => {
  if (isOnSelectedDay(event)) {
    return 1
  }
  const daysFromNow = event.daysFromNow ?? dayjs(event.dateFrom).diff(dayjs(store.selectedDate), 'day')
  return Math.max(0.5, 1 - (Math.abs(daysFromNow) * 0.05))
}
</script>

<style scoped>
.panel {
  padding: 16px;
  background: #f9f9f9;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative;
}

h3 {
  margin: 0 0 12px 0;
  font-size: 1.2em;
  color: #333;
  font-weight: 600;
  flex-shrink: 0;
}

.no-events {
  padding: 20px;
  text-align: center;
  color: #777;
  font-style: italic;
}

.loading {
  padding: 40px 20px;
  text-align: center;
  color: #007bff;
  font-weight: 500;
}

.error {
  padding: 20px;
  text-align: center;
  color: #dc3545;
  background: #fff5f5;
  border-radius: 8px;
  margin: 10px;
}

.error button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.error button:hover {
  background: #0056b3;
}

.nearby-label {
  margin-top: 48px;
  padding: 8px 0;
  font-size: 0.9em;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  opacity: 0.8;
}

.events-section {
  flex: 1;
}

.event-card {
  background: white;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.2s;
  cursor: pointer;
}

.event-card.on-selected-day {
  background: white;
  box-shadow: inset 0 0 0 3px var(--primary-blue), 0 2px 6px rgba(0,0,0,0.08);
}

.event-card.on-selected-day .title {
  color: var(--primary-blue);
}

.event-card.selected {
  border: 2px solid var(--primary-blue);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.event-card.hovered {
  background-color: var(--hover-green);
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  opacity: 1 !important;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.title {
  font-weight: 600;
  color: #222;
  font-size: 1.1em;
}

.type {
  font-size: 0.75em;
  font-weight: 500;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 6px;
  color: white;
  background-color: var(--primary-blue);
}

.event-description {
  font-size: 0.85em;
  color: #666;
  font-style: italic;
  margin: 4px 0 6px 0;
  padding: 4px 8px;
  background: rgba(0, 123, 255, 0.08);
  border-radius: 4px;
  border-left: 3px solid var(--primary-blue);
}


.event-url {
  margin: 6px 0;
}

.event-url a {
  font-size: 0.8em;
  color: #0066cc;
  text-decoration: none;
  word-break: break-all;
}

.event-url a:hover {
  text-decoration: underline;
}

.distance {
  font-size: 0.9em;
  color: #555;
}

/* barevné typy – příklad, můžeš přidat další */
.type.weekly { background-color: #007bff; }
.type.showdown { background-color: #20c997; }
.type.prerelease { background-color: #ffc107; color: #333; }
.type.planetary { background-color: #303030; }
.type.tournament { background-color: #6f42c1; }

.location {
  font-size: 0.95em;
  color: #555;
  margin-bottom: 4px;
}

.time {
  font-size: 0.95em;
  color: #999;
}

.days-from-now {
  font-size: 0.9em;
  color: #666;
  font-weight: 500;
}

@media (max-width: 768px) {
  .panel {
    padding: 8px;
    padding-bottom: 40px;
    overflow-y: auto;
    border-top: 1px solid #ddd;
  }

  h3 {
    font-size: 0.9em;
    margin-bottom: 8px;
  }

  .event-card {
    margin-bottom: 8px;
    padding: 10px 12px;
  }
}
</style>
