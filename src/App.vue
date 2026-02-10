<template>
  <div class="layout" :style="{ '--panel-width': panelWidth + 'px' }">
    <MapView class="map-area" />
    <div
      class="divider"
      @mousedown="startResize"
      @touchstart="startResize"
    ></div>
    <EventPanel class="panel-area" />
    <div class="panel-fade"></div>
    <EventFilters class="filters-area" />
    <TimelineMonth class="timeline-area" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import MapView from '@/components/MapView.vue'
import EventPanel from '@/components/EventPanel.vue'
import EventFilters from '@/components/EventFilters.vue'
import TimelineMonth from '@/components/TimelineMonth.vue'
import { useEventsStore } from '@/stores/eventsStore'

const store = useEventsStore()

// Načíst události z GitHubu při startu
store.loadEvents()

// Výchozí šířka panelu
const DEFAULT_PANEL_WIDTH = 380
const MIN_PANEL_WIDTH = 280
const MAX_PANEL_WIDTH = 800

// Načíst z localStorage nebo použít výchozí
const savedWidth = localStorage.getItem('panelWidth')
const panelWidth = ref(savedWidth ? parseInt(savedWidth, 10) : DEFAULT_PANEL_WIDTH)

let isResizing = false

const startResize = (e) => {
  // Pouze na širších obrazovkách
  if (window.innerWidth <= 768) return

  isResizing = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'

  e.preventDefault()
}

const doResize = (e) => {
  if (!isResizing) return

  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const newWidth = window.innerWidth - clientX

  if (newWidth >= MIN_PANEL_WIDTH && newWidth <= MAX_PANEL_WIDTH) {
    panelWidth.value = newWidth
  }
}

const stopResize = () => {
  if (isResizing) {
    isResizing = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    localStorage.setItem('panelWidth', panelWidth.value.toString())
  }
}

onMounted(() => {
  document.addEventListener('mousemove', doResize)
  document.addEventListener('mouseup', stopResize)
  document.addEventListener('touchmove', doResize)
  document.addEventListener('touchend', stopResize)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', doResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('touchmove', doResize)
  document.removeEventListener('touchend', stopResize)
})
</script>

<style>
:root {
  --primary-blue: #007bff;
  --hover-green: #90ee90;
}

html, body, #app {
  margin: 0;
  height: 100%;
  font-family: system-ui, sans-serif;
}

/* Desktop layout */
.layout {
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr 6px var(--panel-width, 380px);
  grid-template-rows: 1fr auto 100px;
  grid-template-areas:
    "map divider panel"
    "map divider filters"
    "timeline timeline timeline";
}

.map-area {
  grid-area: map;
}

.divider {
  grid-area: divider;
  background: #e0e0e0;
  cursor: col-resize;
  transition: background 0.2s;
  z-index: 100;
}

.divider:hover {
  background: #007bff;
}

.panel-area {
  grid-area: panel;
}

.panel-fade {
  display: none;
}

.filters-area {
  grid-area: filters;
  padding: 8px 16px;
  background: #f9f9f9;
  border-top: 1px solid #ddd;
}

.timeline-area {
  grid-area: timeline;
}

/* Mobile layout */
@media (max-width: 768px) {
  .layout {
    display: grid;
    grid-template-columns: 100vw;
    grid-template-rows: auto 1fr auto auto;
    grid-template-areas:
      "map"
      "panel"
      "filters"
      "timeline";
  }

  .map-area {
    width: 100vw;
    aspect-ratio: 16 / 9;
  }

  .divider {
    display: none;
  }

  .panel-area {
    width: 100vw;
    overflow-y: auto;
    min-height: 0;
  }

  .panel-fade {
    display: block;
    grid-area: panel;
    align-self: end;
    width: 100vw;
    height: 60px;
    background: linear-gradient(to bottom, transparent 0%, #f9f9f9 100%);
    pointer-events: none;
    z-index: 10;
  }

  .filters-area {
    width: 100vw;
    padding: 8px 12px;
    box-sizing: border-box;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
  }

  .timeline-area {
    flex-shrink: 0;
  }
}
</style>
