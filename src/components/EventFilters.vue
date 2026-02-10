<template>
  <div class="filters-container">
    <div class="type-filter">
      <label>Filtruj:</label>
      <div class="type-checkboxes">
        <label v-for="type in store.availableTypes" :key="type" class="type-checkbox">
          <span :class="['type-label', type]">
            <input
              type="checkbox"
              :checked="store.selectedTypes.includes(type)"
              @change="toggleType(type)"
            />
            {{ getTypeLabel(type) }}
          </span>
        </label>
      </div>
    </div>

    <div class="distance-slider-container">
      <label for="distance-slider">Vzdálenost: {{ store.maxDistance }} km</label>
      <input
        id="distance-slider"
        v-model.number="store.maxDistance"
        type="range"
        min="10"
        max="1000"
        @input="store.setMaxDistance(store.maxDistance)"
        class="distance-slider"
      />
      <div class="slider-labels">
        <span>10 km</span>
        <span>1000 km</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useEventsStore } from '@/stores/eventsStore'

const store = useEventsStore()

const typeLabels = {
  'weekly': 'weekly',
  'showdown': 'showdown',
  'prerelease': 'prerelease',
  'planetary': 'planetary',
  'tournament': 'turnaj'
}

const getTypeLabel = (type) => typeLabels[type] || type

const toggleType = (type) => {
  const newTypes = store.selectedTypes.includes(type)
    ? store.selectedTypes.filter(t => t !== type)
    : [...store.selectedTypes, type]
  store.setSelectedTypes(newTypes)
}
</script>

<style scoped>
.filters-container {
  padding: 12px 14px;
  background: #f0f4f8;
  border-radius: 8px;
  border: 1px solid #d0d8e0;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.type-filter {
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #d0d8e0;
}

.type-filter > label {
  display: block;
  font-size: 0.9em;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.type-checkbox {
  display: inline-block;
  cursor: pointer;
}

.type-checkbox input {
  margin: 0 4px 0 0;
  cursor: pointer;
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

.type-label {
  font-size: 0.85em;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  color: #333;
  background-color: #e8e8e8;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s;
}

.type-label:has(input:checked) {
  color: white;
}

.type-label.weekly:has(input:checked) { background-color: #007bff; }
.type-label.showdown:has(input:checked) { background-color: #20c997; }
.type-label.prerelease:has(input:checked) { background-color: #ffc107; color: #333; }
.type-label.planetary:has(input:checked) { background-color: #303030; }
.type-label.tournament:has(input:checked) { background-color: #6f42c1; }

.distance-slider-container label {
  display: block;
  font-size: 0.9em;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.distance-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.distance-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-blue);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.distance-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-blue);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: none;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75em;
  color: #999;
  margin-top: 6px;
}

/* Mobile styles */
@media (max-width: 768px) {
  .filters-container {
    display: flex;
    gap: 16px;
    padding: 8px 12px;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .type-filter {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
    border-right: 1px solid #d0d8e0;
    padding-right: 16px;
  }

  .type-filter > label {
    font-size: 0.75em;
    margin-bottom: 6px;
  }

  .type-checkboxes {
    gap: 4px;
  }

  .type-label {
    font-size: 0.7em;
    padding: 3px 6px;
  }

  .type-checkbox input {
    width: 14px;
    height: 14px;
  }

  .distance-slider-container {
    flex: 1;
    min-width: 120px;
  }

  .distance-slider-container label {
    font-size: 0.75em;
    margin-bottom: 6px;
  }

  .distance-slider {
    height: 4px;
  }

  .distance-slider::-webkit-slider-thumb {
    width: 16px;
    height: 16px;
  }

  .slider-labels {
    font-size: 0.65em;
  }
}
</style>
