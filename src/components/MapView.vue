<template>
  <div class="map" ref="mapContainer">
    <div class="logo" @click="resetToToday">SWU Events</div>
    <LMap
      ref="leafletMap"
      :zoom="calculatedZoom"
      :center="[store.mapCenter.lat, store.mapCenter.lng]"
      style="height: 100%; width: 100%"
      @update:center="onMove"
    >

       <!-- Tile Layer -->
      <LTileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <!-- Kruh zobrazující dosah hledání akcí -->
      <LCircle
        :lat-lng="[store.mapCenter.lat, store.mapCenter.lng]"
        :radius="store.maxDistance * 1000"
        :color="COLORS.primary"
        :fillColor="COLORS.primary"
        :fillOpacity="0.05"
        :opacity="0.2"
        :weight="1"
      />

      <!-- Aktuální pozice uživatele -->
      <LMarker
        :lat-lng="[store.mapCenter.lat, store.mapCenter.lng]"
        :icon="currentLocationIcon"
        :z-index-offset="1000"
      >
        <LPopup>
          Vaše aktuální pozice
        </LPopup>
      </LMarker>
        
      <!-- Markery pro všechny akce (modré pro dnešní, šedé pro ostatní) -->
      <LMarker
        v-for="e in store.filteredEvents"
        :key="'event-' + e.id"
        :lat-lng="[e.location.lat, e.location.lng]"
        :icon="getEventIcon(e)"
      >
        <LPopup>
          <strong>{{ e.title }}</strong><br />
          {{ e.location.place }}, {{ e.location.city }}
        </LPopup>
      </LMarker>

      <!-- Modrý marker pro vybranou akci -->
      <LMarker
        v-if="store.selectedEvent"
        :key="'blue-selected'"
        :lat-lng="[store.selectedEvent.location.lat, store.selectedEvent.location.lng]"
        :icon="blueIcon "
      >
        <LPopup>
          <strong>{{ store.selectedEvent.title }}</strong><br />
          {{ store.selectedEvent.location.place }}, {{ store.selectedEvent.location.city }}
        </LPopup>
      </LMarker>

      <!-- Zelený marker pro hovered akci (pokud je jiná než selected) -->
      <LMarker
        v-if="store.hoveredEvent && store.hoveredEvent.id !== store.selectedEvent?.id"
        :key="'green-hover'"
        :lat-lng="[store.hoveredEvent.location.lat, store.hoveredEvent.location.lng]"
        :icon="greenIcon"
      >
        <LPopup>
          <strong>{{ store.hoveredEvent.title }}</strong><br />
          {{ store.hoveredEvent.location.place }}, {{ store.hoveredEvent.location.city }}
        </LPopup>
      </LMarker>
    </LMap>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useEventsStore } from '@/stores/eventsStore'
import { LMap, LTileLayer, LMarker, LPopup, LCircle } from '@vue-leaflet/vue-leaflet'
import L from 'leaflet'
import dayjs from '@/dayjs'

const store = useEventsStore()

const mapContainer = ref(null)
const leafletMap = ref(null)
let resizeObserver = null

// Barvy pro Leaflet komponenty (musí být JS hodnoty, ne CSS proměnné)
const COLORS = {
  primary: '#FFE81F',
  markerDefault: '#555555',
  markerHover: '#4BD5EE',
  location: '#4BD5EE'
}

// Vypočítat zoom tak, aby kruh byl vidět
const calculatedZoom = computed(() => {
  const distanceKm = store.maxDistance
  const isMobile = window.innerWidth <= 768

  // Mobil má 16:9 poměr (menší výška), potřebuje více oddálit
  // Desktop má více prostoru, může být přiblíženo
  const baseZoom = isMobile ? 7 : 8
  const baseDistance = isMobile ? 100 : 150

  const zoom = baseZoom - Math.log2(distanceKm / baseDistance)
  return Math.max(4, Math.min(11, Math.round(zoom)))
})

// Vytvoření vlastních ikon
const createMarkerIcon = (color) => L.icon({
  iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      <path fill="${color}" stroke="#333" stroke-width="1.5" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.4 12.5 28.5 12.5 28.5S25 20.9 25 12.5C25 5.6 19.4 0 12.5 0z"/>
      <circle cx="12.5" cy="12.5" r="5" fill="#fff"/>
    </svg>
  `)}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
})

const whiteIcon = createMarkerIcon(COLORS.markerDefault)
const blueIcon = createMarkerIcon(COLORS.primary)
const greenIcon = createMarkerIcon(COLORS.markerHover)

// Vrátí modrou ikonu pro dnešní události, jinak bílou
const getEventIcon = (event) => {
  const today = dayjs().format('YYYY-MM-DD')
  const eventDate = dayjs(event.dateFrom).format('YYYY-MM-DD')
  return eventDate === today ? blueIcon : whiteIcon
}

// Ikona pro aktuální pozici uživatele
const currentLocationIcon = L.icon({
  iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill="${COLORS.location}" opacity="0.3"/>
      <circle cx="12" cy="12" r="7" fill="${COLORS.location}"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  `)}`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
})

const onMove = (center) => {
  // center je objekt typu LatLng
  store.setMapCenter({
    lat: center.lat,
    lng: center.lng
  })
}

const resetToToday = () => {
  store.resetToToday()
}

onMounted(() => {
  // Pokus o geolokaci - ale jen pokud není pozice z URL
  const urlParams = new URLSearchParams(window.location.search)
  const hasUrlPosition = urlParams.has('lat') && urlParams.has('lng')

  if (!hasUrlPosition && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        store.setMapCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      () => {
        console.log('Geolokace není dostupná nebo byla zakázána')
      }
    )
  }

  // Překreslit mapu při změně velikosti kontejneru (resize divider)
  resizeObserver = new ResizeObserver(() => {
    const map = leafletMap.value?.leafletObject
    if (map) map.invalidateSize()
  })
  if (mapContainer.value) resizeObserver.observe(mapContainer.value)
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<style scoped>
.map {
  height: 100%;
  width: 100%;
  position: relative;
}

@media (max-width: 768px) {
  .map {
    height: 100%;
    width: 100%;
  }
}

.logo {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  background: var(--bg-card);
  padding: 8px 12px;
  border-radius: 6px;
  box-shadow: var(--shadow-logo);
  cursor: pointer;
  transition: all 0.2s;
}

.logo:hover {
  box-shadow: var(--shadow-logo-hover);
  transform: translateY(-1px);
}
</style>
