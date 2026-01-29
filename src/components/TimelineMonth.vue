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
          hasShowdown: d.hasShowdown,
          hasPlanetary: d.hasPlanetary
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
const currentMonth = ref(dayjs().startOf('month'))
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
      hasShowdown: dayEvents.some(e => e.type === 'showdown'),
      hasPlanetary: dayEvents.some(e => e.type === 'planetary')
    })
    d = d.add(1, 'day')
  }
  return arr
})

// Scroll na aktivní den, když se změní selectedDate
watch(() => store.selectedDate, () => {
  scrollToActiveDay()
})

const prevMonth = () => {
  currentMonth.value = currentMonth.value.subtract(1, 'month')
}

const nextMonth = () => {
  currentMonth.value = currentMonth.value.add(1, 'month')
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
  background: #fafafa;
  border-top: 1px solid #e0e0e0;
  box-sizing: border-box;
  grid-column: 1 / 3;
  grid-row: 2 / 3;
}

@media (max-width: 768px) {
  .timeline-wrapper {
    flex: 0 0 120px;
    grid-column: 1 / 2;
    grid-row: 3 / 4;
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
  border: 1px solid #90caf9;
  background-color: #e3f2fd;
  color: #333;
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 1.2em;
}

.month-controls button:hover {
  background-color: #90caf9;
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
  background: #eee;
  transform: scale(1.15);
}

.day.active {
  background: var(--primary-blue) !important;
  color: white;
  border: 1px solid var(--primary-blue) !important;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.day.weekend {
  background-color: #fff3cd;
  border-color: #ffc107;
}

.day.weekend.active {
  background: var(--primary-blue);
  color: white;
}

.day.today {
  background-color: var(--hover-green) !important;
  color: #333 !important;
  border: 2px solid #7bc87b !important;
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
  background-color: #e3f2fd;
  border: 1px solid #90caf9;
}

.day.hasTournament {
  background-color: #e8d5f5 !important;
  border: 1px solid #9c27b0 !important;
}

.day.hasTournament .count {
  color: #9c27b0;
}

.day.hasShowdown {
  background-color: #d4edda !important;
  border: 1px solid #28a745 !important;
}

.day.hasShowdown .count {
  color: #28a745;
}

.day.hasPlanetary {
  background-color: #303030 !important;
  color: white !important;
  border: 1px solid #303030 !important;
}

.day.hasPlanetary .count {
  color: #ffc107;
}

.day.hasTournament.active .count,
.day.hasShowdown.active .count,
.day.hasPlanetary.active .count {
  color: white;
}

.day.past {
  opacity: 0.5;
}
</style>
