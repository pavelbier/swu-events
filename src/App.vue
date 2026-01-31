<template>
  <div class="layout" :style="{ '--panel-width': panelWidth + 'px' }">
    <MapView />
    <div
      class="divider"
      @mousedown="startResize"
      @touchstart="startResize"
    ></div>
    <EventPanel />
    <TimelineMonth />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import MapView from '@/components/MapView.vue'
import EventPanel from '@/components/EventPanel.vue'
import TimelineMonth from '@/components/TimelineMonth.vue'

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

.layout {
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr 6px var(--panel-width, 380px);
  grid-template-rows: 1fr 140px;
}

.divider {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  background: #e0e0e0;
  cursor: col-resize;
  transition: background 0.2s;
  z-index: 100;
}

.divider:hover {
  background: #007bff;
}

@media (max-width: 768px) {
  .layout {
    display: flex;
    flex-direction: column;
  }

  .divider {
    display: none;
  }
}
</style>
