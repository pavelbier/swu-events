<template>
  <div class="calendar-view">
    <div class="cal-header">
      <a href="." class="back-link">← Zpět na mapu</a>
      <h1>Turnajový kalendář SWU</h1>
    </div>

    <div class="cal-filters">
      <span class="filter-label">Zobrazit:</span>
      <label v-for="type in calendarTypes" :key="type" class="type-checkbox">
        <span :class="['type-label', type, { active: selectedTypes.includes(type) }]">
          <input
            type="checkbox"
            :checked="selectedTypes.includes(type)"
            @change="toggleType(type)"
          />
          {{ typeLabels[type] }}
        </span>
      </label>
      <span class="filter-sep">|</span>
      <button :class="['past-toggle', { active: timeFilter === 'prevMonth' }]" @click="toggleFilter('prevMonth')">
        {{ prevMonthLabel }}
      </button>
      <button :class="['past-toggle', { active: timeFilter === 'thisMonth' }]" @click="toggleFilter('thisMonth')">
        {{ thisMonthLabel }}
      </button>
      <button :class="['past-toggle', { active: timeFilter === 'fullYear' }]" @click="toggleFilter('fullYear')">
        Celý rok {{ currentYear }}
      </button>
    </div>

    <div v-if="store.isLoading" class="cal-loading">Načítám události...</div>
    <div v-else-if="store.loadError" class="cal-error">Chyba při načítání: {{ store.loadError }}</div>

    <div v-else class="cal-content">
      <div v-if="Object.keys(groupedEvents).length === 0" class="no-events">
        Žádné nadcházející akce pro vybrané typy.
      </div>

      <div v-for="(events, date) in groupedEvents" :key="date" class="date-group">
        <div class="date-header">
          <span class="date-text">{{ formatDateHeader(date) }}</span>
          <span class="date-days">({{ daysText(date) }})</span>
        </div>
        <div class="events-row">
          <div v-for="e in events" :key="e.id" :class="['event-card', { 'is-past': date < today }]">
            <div class="card-header">
              <span class="title">{{ e.title }}</span>
              <span class="type" :class="e.type">{{ typeLabels[e.type] || e.type }}</span>
            </div>

            <div v-if="e.description" class="event-description">
              {{ e.description }}
            </div>

            <div v-if="e.url" class="event-url">
              <a :href="e.url" target="_blank" rel="noopener noreferrer">{{ e.url }}</a>
            </div>

            <div class="location">📍 {{ e.location.place }}, {{ e.location.city }}</div>

            <div class="time">
              ⏰ {{ formatTime(e.dateFrom) }} – {{ formatEnd(e.dateFrom, e.dateTo) }}
              <span class="days-from-now">({{ daysText(e.dateFrom) }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import dayjs from '@/dayjs'
import { useEventsStore } from '@/stores/eventsStore'

const store = useEventsStore()

const calendarTypes = ['showdown', 'prerelease', 'planetary', 'regional', 'sector']
const selectedTypes = ref([...calendarTypes])
const timeFilter = ref(null) // null | 'prevMonth' | 'thisMonth' | 'fullYear'
const currentYear = dayjs().year()

const typeLabels = {
  showdown: 'showdown',
  prerelease: 'prerelease',
  planetary: 'planetary',
  regional: 'regional',
  sector: 'sector',
}

const toggleType = (type) => {
  if (selectedTypes.value.includes(type)) {
    selectedTypes.value = selectedTypes.value.filter(t => t !== type)
  } else {
    selectedTypes.value = [...selectedTypes.value, type]
  }
}

const toggleFilter = (value) => {
  timeFilter.value = timeFilter.value === value ? null : value
}

const today = dayjs().format('YYYY-MM-DD')
const yearStart   = dayjs().startOf('year').format('YYYY-MM-DD')
const monthStart  = dayjs().startOf('month').format('YYYY-MM-DD')
const monthEnd    = dayjs().endOf('month').format('YYYY-MM-DD')
const prevStart   = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
const prevEnd     = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')

const thisMonthLabel = dayjs().format('MMMM')
const prevMonthLabel = dayjs().subtract(1, 'month').format('MMMM')

const groupedEvents = computed(() => {
  let from = today, to = null
  if (timeFilter.value === 'fullYear')   { from = yearStart }
  if (timeFilter.value === 'thisMonth')  { from = monthStart; to = monthEnd }
  if (timeFilter.value === 'prevMonth')  { from = prevStart;  to = prevEnd }

  const filtered = store.events
    .filter(e => {
      const dateKey = dayjs(e.dateFrom).format('YYYY-MM-DD')
      return selectedTypes.value.includes(e.type)
        && dateKey >= from
        && (to === null || dateKey <= to)
    })
    .sort((a, b) => dayjs(a.dateFrom).valueOf() - dayjs(b.dateFrom).valueOf())

  const groups = {}
  for (const e of filtered) {
    const dateKey = dayjs(e.dateFrom).format('YYYY-MM-DD')
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(e)
  }
  return groups
})

const formatDateHeader = (date) => dayjs(date).format('dddd D. MMMM YYYY')

const formatTime = (d) => dayjs(d).format('HH:mm')

const formatEnd = (dateFrom, dateTo) => {
  const from = dayjs(dateFrom)
  const to = dayjs(dateTo)
  if (from.isSame(to, 'day')) return to.format('HH:mm')
  return to.format('dd D.M. HH:mm')
}

const daysText = (eventDate) => {
  const diff = dayjs(eventDate).startOf('day').diff(dayjs().startOf('day'), 'day')
  if (diff === 0) return 'dnes'
  if (diff === 1) return 'za 1 den'
  if (diff > 1 && diff < 5) return `za ${diff} dny`
  if (diff >= 5) return `za ${diff} dní`
  if (diff === -1) return 'včera'
  const abs = Math.abs(diff)
  if (abs < 5) return `před ${abs} dny`
  return `před ${abs} dny`
}
</script>

<style scoped>
.calendar-view {
  min-height: 100vh;
  background: var(--bg-panel);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

/* Header */
.cal-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 24px;
  background: var(--bg-filters);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}

.back-link {
  color: var(--text-link);
  text-decoration: none;
  font-size: 0.9em;
  white-space: nowrap;
  padding: 6px 12px;
  border: 1px solid var(--border-button);
  border-radius: 6px;
  background: var(--bg-button);
  transition: background 0.15s, border-color 0.15s;
}

.back-link:hover {
  background: var(--border-button);
  border-color: var(--text-link);
}

h1 {
  margin: 0;
  font-size: 1.3em;
  color: var(--primary-blue);
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Filters */
.cal-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 24px;
  background: var(--bg-filters);
  border-bottom: 2px solid var(--border-light);
  flex-shrink: 0;
}

.filter-label {
  font-size: 0.85em;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-right: 4px;
}

.type-checkbox {
  display: inline-block;
  cursor: pointer;
}

.type-checkbox input {
  margin: 0 4px 0 0;
  cursor: pointer;
  width: 14px;
  height: 14px;
  vertical-align: middle;
}

.type-label {
  font-size: 0.82em;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  color: var(--text-secondary);
  background-color: var(--border-light);
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s, color 0.2s;
  user-select: none;
}

.type-label:has(input:checked) { color: white; }
.type-label.showdown:has(input:checked)   { background-color: var(--type-showdown); }
.type-label.prerelease:has(input:checked) { background-color: var(--type-prerelease); color: #1a1a1a; }
.type-label.planetary:has(input:checked)  { background-color: var(--type-planetary); }
.type-label.regional:has(input:checked)   { background-color: var(--type-regional); }
.type-label.sector:has(input:checked)     { background-color: var(--type-sector); }

.filter-sep {
  color: var(--border-light);
  font-size: 1.1em;
  margin: 0 2px;
  user-select: none;
}

.past-toggle {
  font-size: 0.82em;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid var(--border-light);
  background: var(--border-light);
  color: var(--text-secondary);
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  letter-spacing: 0.3px;
}

.past-toggle.active {
  background-color: var(--primary-blue);
  border-color: var(--primary-blue);
  color: #1a1a1a;
}

/* Content */
.cal-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 40px;
}

.cal-loading,
.cal-error {
  padding: 40px 24px;
  text-align: center;
  font-size: 1em;
}

.cal-loading { color: var(--primary-blue); }
.cal-error { color: var(--text-error); }

.no-events {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-tertiary);
  font-style: italic;
}

/* Date group */
.date-group {
  margin-top: 28px;
}

.date-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 8px 0 10px;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 14px;
  position: sticky;
  top: 0;
  background: var(--bg-panel);
  z-index: 10;
}

.date-text {
  font-size: 1.05em;
  font-weight: 700;
  color: var(--primary-blue);
  text-transform: capitalize;
}

.date-days {
  font-size: 0.85em;
  color: var(--text-tertiary);
}

/* Events row */
.events-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* Event card – stejný styl jako EventPanel */
.event-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: var(--shadow-card);
  width: 300px;
  flex-shrink: 0;
  transition: transform 0.15s, box-shadow 0.15s;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-logo-hover);
}

.event-card.is-past {
  opacity: 0.55;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.title {
  font-weight: 600;
  color: var(--text-dark);
  font-size: 1.05em;
}

.type {
  font-size: 0.75em;
  font-weight: 500;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 6px;
  color: white;
  background-color: var(--primary-blue);
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: 6px;
}

.type.showdown   { background-color: var(--type-showdown); }
.type.prerelease { background-color: var(--type-prerelease); color: #1a1a1a; }
.type.planetary  { background-color: var(--type-planetary); }
.type.regional   { background-color: var(--type-regional); }
.type.sector     { background-color: var(--type-sector); }

.event-description {
  font-size: 0.85em;
  color: var(--text-secondary);
  font-style: italic;
  margin: 4px 0 6px 0;
  padding: 4px 8px;
  background: var(--bg-description);
  border-radius: 4px;
  border-left: 3px solid var(--primary-blue);
}

.event-url {
  margin: 6px 0;
}

.event-url a {
  font-size: 0.8em;
  color: var(--text-link);
  text-decoration: none;
  word-break: break-all;
}

.event-url a:hover {
  text-decoration: underline;
}

.location {
  font-size: 0.9em;
  color: var(--text-location);
  margin-bottom: 4px;
}

.time {
  font-size: 0.9em;
  color: var(--text-muted);
}

.days-from-now {
  font-size: 0.88em;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Mobile */
@media (max-width: 768px) {
  .cal-header {
    padding: 10px 14px;
    gap: 12px;
  }

  h1 {
    font-size: 1em;
  }

  .cal-filters {
    padding: 10px 14px;
    gap: 6px;
  }

  .cal-content {
    padding: 0 14px 32px;
  }

  .events-row {
    flex-direction: column;
  }

  .event-card {
    width: auto;
  }

  .date-text {
    font-size: 0.95em;
  }
}
</style>
