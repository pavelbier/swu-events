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
  /* Primární barvy */
  --primary-blue: #007bff;
  --hover-green: #90ee90;

  /* Barvy typů akcí */
  --type-weekly: #007bff;
  --type-showdown: #20c997;
  --type-prerelease: #ffc107;
  --type-planetary: #303030;
  --type-tournament: #6f42c1;

  /* Pozadí */
  --bg-panel: #f9f9f9;
  --bg-filters: #f0f4f8;
  --bg-timeline: #fafafa;
  --bg-card: white;
  --bg-weekend: #fff3cd;
  --bg-error: #fff5f5;
  --bg-button: #e3f2fd;
  --bg-showdown-day: #d4edda;
  --bg-tournament-day: #e8d5f5;
  --bg-description: rgba(0, 123, 255, 0.08);

  /* Text */
  --text-primary: #333;
  --text-secondary: #666;
  --text-tertiary: #777;
  --text-dark: #222;
  --text-muted: #999;
  --text-location: #555;
  --text-link: #0066cc;
  --text-error: #dc3545;

  /* Okraje */
  --border-light: #ddd;
  --border-filter: #d0d8e0;
  --border-divider: #e0e0e0;
  --border-weekend: #ffc107;
  --border-button: #90caf9;
  --border-showdown: #28a745;
  --border-today: #7bc87b;
  --border-tournament: #9c27b0;

  /* Mapa */
  --marker-default: #cccccc;
  --marker-location: #4285F4;

  /* Stíny */
  --shadow-card: 0 2px 6px rgba(0, 0, 0, 0.08);
  --shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.12);
  --shadow-selected: 0 4px 12px rgba(0, 123, 255, 0.3);
  --shadow-logo: 0 2px 8px rgba(0, 0, 0, 0.12);
  --shadow-logo-hover: 0 4px 12px rgba(0, 0, 0, 0.18);
  --shadow-thumb: 0 2px 4px rgba(0, 0, 0, 0.2);
  --shadow-inset: inset 0 1px 3px rgba(0, 0, 0, 0.05);
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
  grid-template-rows: 1fr auto 130px;
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
  background: var(--border-divider);
  cursor: col-resize;
  transition: background 0.2s;
  z-index: 100;
}

.divider:hover {
  background: var(--primary-blue);
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
  background: var(--bg-panel);
  border-top: 1px solid var(--border-light);
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
    background: linear-gradient(to bottom, transparent 0%, var(--bg-panel) 100%);
    pointer-events: none;
    z-index: 10;
  }

  .filters-area {
    width: 100vw;
    padding: 8px 12px;
    box-sizing: border-box;
    border-top: 1px solid var(--border-light);
    border-bottom: 1px solid var(--border-light);
  }

  .timeline-area {
    flex-shrink: 0;
  }
}
</style>
