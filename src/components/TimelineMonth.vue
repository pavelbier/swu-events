<template>
  <div class="timeline-wrapper">
    <div class="month-controls">
      <button @click="prevMonth">◀</button>
      <span class="month-name">{{ currentMonth.format('MMMM YYYY') }}</span>
      <button @click="nextMonth">▶</button>
    </div>

    <div class="timeline" ref="timelineEl">
      <div
        v-for="d in days"
        :key="d.date"
        :ref="el => { if (d.date === store.selectedDate) activeDayEl = el }"
        class="day"
        :class="{
          active: d.date === store.selectedDate,
          today: d.date === dayjs().format('YYYY-MM-DD'),
          weekend: d.isWeekend,
          hasEvents: d.eventCount > 0,
          past: d.isPast,
          hasTournament: d.hasTournament,
          hasPrerelease: d.hasPrerelease,
          hasShowdown: d.hasShowdown,
          hasPlanetary: d.hasPlanetary,
          hasRegional: d.hasRegional,
          hasSector: d.hasSector
        }"
        @click="store.setDate(d.date)"
      >
        <div class="dow">{{ d.dayName }}</div>
        <div class="num">{{ d.dayNumber }}</div>
        <div class="count" v-if="d.eventCount > 0">{{ d.eventCount }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, watch } from 'vue'
import dayjs from '@/dayjs'
import { useEventsStore } from '@/stores/eventsStore'

const store = useEventsStore()
const currentMonth = ref(dayjs(store.selectedDate).startOf('month'))
const timelineEl = ref(null)
const activeDayEl = ref(null)

const scrollToActiveDay = async () => {
  await nextTick()
  if (activeDayEl.value && timelineEl.value) {
    const element = Array.isArray(activeDayEl.value) ? activeDayEl.value[0] : activeDayEl.value
    element?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }
}

// Scroll na aktuální den při prvním načtení
ref({ onMounted: scrollToActiveDay })

const days = computed(() => {
  const start = currentMonth.value.startOf('month')
  const end = currentMonth.value.endOf('month')
  const arr = []

  let d = start
  while (d.isBefore(end) || d.isSame(end, 'day')) {
    const dayEvents = store.events.filter(
      e => d.isBetween(dayjs(e.dateFrom), dayjs(e.dateTo), 'day', '[]') && store.selectedTypes.includes(e.type)
    )

    arr.push({
      date: d.format('YYYY-MM-DD'),
      dayNumber: d.date(),
      dayName: d.format('dd'), // kompaktní Po, Út, St...
      isWeekend: d.day() === 0 || d.day() === 6,
      eventCount: dayEvents.length,
      isPast: d.isBefore(dayjs(), 'day'),
      hasTournament: dayEvents.some(e => e.type === 'tournament'),
      hasPrerelease: dayEvents.some(e => e.type === 'prerelease'),
      hasShowdown: dayEvents.some(e => e.type === 'showdown'),
      hasPlanetary: dayEvents.some(e => e.type === 'planetary'),
      hasRegional: dayEvents.some(e => e.type === 'regional'),
      hasSector: dayEvents.some(e => e.type === 'sector')
    })
    d = d.add(1, 'day')
  }
  return arr
})

// Při změně selectedDate přepni měsíc (pokud je jiný) a scrollni na den
watch(() => store.selectedDate, (newDate) => {
  const newMonth = dayjs(newDate).startOf('month')
  if (!newMonth.isSame(currentMonth.value, 'month')) {
    currentMonth.value = newMonth
  }
  scrollToActiveDay()
})

const scrollToStart = async () => {
  await nextTick()
  if (timelineEl.value) {
    timelineEl.value.scrollTo({ left: 0, behavior: 'instant' })
  }
}

const prevMonth = () => {
  currentMonth.value = currentMonth.value.subtract(1, 'month')
  scrollToStart()
}

const nextMonth = () => {
  currentMonth.value = currentMonth.value.add(1, 'month')
  scrollToStart()
}

// Scroll na aktivní den při prvním mounted
import { onMounted } from 'vue'
onMounted(() => {
  setTimeout(scrollToActiveDay, 100)
})
</script>

<style scoped>
.timeline-wrapper {
  padding: 6px;
  background: var(--bg-timeline);
  border-top: 1px solid var(--border-divider);
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .timeline-wrapper {
    padding: 4px;
  }
}

.month-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  gap: 12px;
  font-size: medium;
}

.month-controls button {
  border: 1px solid var(--border-button);
  background-color: var(--bg-button);
  color: var(--text-primary);
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 1.2em;
}

.month-controls button:hover {
  background-color: var(--border-button);
  color: white;
}

.month-name {
  font-size: 0.9em;
  text-transform: capitalize;
}

.timeline {
  display: flex;
  overflow-x: auto;
  overflow-y: visible;
  padding: 8px 0 12px 0;
  justify-content: center;
}

@media screen and (max-width: 1800px) {
  .timeline {
    justify-content: flex-start;
  }
}

.day {
  min-width: 48px;
  margin-right: 4px;
  padding: 4px 2px;
  text-align: center;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 0.8em;
  transition: transform 0.2s ease, background 0.2s ease;
}

.day:hover {
  background: var(--border-light);
  transform: scale(1.15);
  box-shadow: var(--shadow-logo-hover);
}

.day.active {
  border: 2px solid var(--primary-blue) !important;
}

.day.weekend {
  background-color: var(--bg-weekend);
  border-color: var(--border-weekend);
}

.day.weekend.active {
  border: 2px solid var(--primary-blue) !important;
}

.day.today {
  background-color: var(--primary-blue) !important;
  color: #1a1a1a !important;
  border: 1px solid var(--primary-blue) !important;
}

.day.today .count {
  color: #1a1a1a;
}

.day.today.active {
  border: 2px solid var(--primary-blue) !important;
}

.dow {
  font-weight: 500;
}

.num {
  font-weight: 600;
}

.count {
  font-size: 0.75em;
  color: var(--primary-blue);
  font-weight: bold;
  margin-top: 1px;
}

.day.active .count {
  color: white;
}

.day.hasEvents {
  background-color: var(--bg-button);
  border: 1px solid var(--border-button);
}

.day.hasTournament {
  background-color: var(--bg-tournament-day) !important;
  border: 1px solid var(--border-tournament) !important;
}

.day.hasTournament .count {
  color: var(--border-tournament);
}

.day.hasPrerelease {
  background-color: var(--bg-prerelease-day) !important;
  border: 1px solid var(--border-prerelease) !important;
}

.day.hasPrerelease .count {
  color: var(--border-prerelease);
}

.day.hasShowdown {
  background-color: var(--bg-showdown-day) !important;
  border: 1px solid var(--border-showdown) !important;
}

.day.hasShowdown .count {
  color: var(--border-showdown);
}

.day.hasPlanetary {
  background-color: var(--type-planetary) !important;
  color: white !important;
  border: 1px solid var(--type-planetary) !important;
}

.day.hasPlanetary .count {
  color: var(--type-prerelease);
}

.day.hasRegional {
  background-color: var(--type-regional) !important;
  color: white !important;
  border: 1px solid var(--type-regional) !important;
}

.day.hasRegional .count {
  color: var(--type-prerelease);
}


.day.hasTournament.active .count,
.day.hasPrerelease.active .count,
.day.hasShowdown.active .count,
.day.hasRegional.active .count,
.day.hasPlanetary.active .count {
  color: white;
}

.day.past {
  opacity: 0.5;
}
</style>
