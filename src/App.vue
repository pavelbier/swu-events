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
  /* Primární barvy – Star Wars theme */
  --primary-blue: #FFE81F;           /* Star Wars zlatá */
  --hover-green: rgba(75, 213, 238, 0.15); /* hologram cyan - subtle */

  /* Barvy typů akcí */
  --type-weekly: #4A90D9;            /* modrý lightsaber */
  --type-showdown: #5CB85C;          /* zelený lightsaber */
  --type-prerelease: #FF8C00;        /* oranžová */
  --type-planetary: #E05030;         /* Sith red */
  --type-tournament: #C850C0;        /* purpurový lightsaber */

  /* Pozadí */
  --bg-panel: #0d1117;              /* tmavý vesmír */
  --bg-filters: #161b22;            /* tmavší panel */
  --bg-timeline: #0d1117;           /* tmavý vesmír */
  --bg-card: #1c2333;               /* karta */
  --bg-weekend: #2a1f00;            /* tmavá zlatá */
  --bg-error: #3d1111;              /* tmavá červená */
  --bg-button: #1a2744;             /* tlačítko */
  --bg-showdown-day: #1a2e1a;       /* tmavá zelená */
  --bg-prerelease-day: #5c2800;     /* výrazná oranžová */
  --bg-tournament-day: #2a1a3e;     /* tmavá purpurová */
  --bg-description: rgba(255, 232, 31, 0.08); /* zlatý nádech */

  /* Text */
  --text-primary: #e6e6e6;          /* světlý text */
  --text-secondary: #a0a0a0;        /* šedý text */
  --text-tertiary: #888;            /* tlumený */
  --text-dark: #f0f0f0;             /* nejsvětlejší */
  --text-muted: #666;               /* hodně tlumený */
  --text-location: #b0b0b0;         /* lokace */
  --text-link: #4BD5EE;             /* cyan odkaz */
  --text-error: #ff6b6b;            /* červená chyba */

  /* Okraje */
  --border-light: #2a2a3a;          /* jemný okraj */
  --border-filter: #2a3040;         /* filtr okraj */
  --border-divider: #1e2530;        /* dělič */
  --border-weekend: #665500;        /* víkend */
  --border-button: #3a5080;         /* tlačítko */
  --border-prerelease: #cc7000;     /* oranžová */
  --border-showdown: #3a7a3a;       /* zelená */
  --border-today: #4BD5EE;          /* cyan dnes */
  --border-tournament: #8a3a9a;     /* purpurová */

  /* Mapa */
  --marker-default: #555;
  --marker-location: #4BD5EE;

  /* Stíny */
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-card-hover: 0 4px 16px rgba(0, 0, 0, 0.5);
  --shadow-selected: 0 4px 16px rgba(255, 232, 31, 0.3);
  --shadow-logo: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-logo-hover: 0 4px 12px rgba(255, 232, 31, 0.3);
  --shadow-thumb: 0 2px 4px rgba(0, 0, 0, 0.5);
  --shadow-inset: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

html, body, #app {
  margin: 0;
  height: 100%;
  font-family: system-ui, sans-serif;
  background: var(--bg-panel);
  color: var(--text-primary);
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
