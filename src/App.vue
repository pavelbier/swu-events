<template>
  <div class="layout">
    <MapView />
    <EventPanel />
    <TimelineMonth />
  </div>
</template>

<script setup>
import MapView from '@/components/MapView.vue'
import EventPanel from '@/components/EventPanel.vue'
import TimelineMonth from '@/components/TimelineMonth.vue'
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
  grid-template-columns: 1fr 380px;
  grid-template-rows: 1fr 140px;
}

@media (max-width: 768px) {
  .layout {
    display: flex;
    flex-direction: column;
  }
}
</style>
