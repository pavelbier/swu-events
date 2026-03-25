# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SWU Events is a Star Wars Unlimited (TCG) event finder — a Vue 3 single-page app that shows upcoming game events on an interactive map with filtering, distance-based sorting, and a monthly timeline. The UI uses a dark Star Wars theme with Czech localization (dayjs locale `cs`).

## Commands

- `npm run dev` — start Vite dev server (loads events from local JSON files)
- `npm run build` — production build (output to `dist/`)
- `npm run preview` — preview production build

There are no tests or linters configured.

## Architecture

**Stack:** Vue 3 (Composition API, `<script setup>`), Pinia store, Vite 7, Leaflet map via `@vue-leaflet/vue-leaflet`, dayjs for dates.

**Layout (App.vue):** CSS Grid with a resizable divider between the map (left) and event panel (right). On mobile (<=768px), stacks vertically. The map width percentage is persisted in `localStorage`.

**Data flow:**
- Event data lives in `src/data/events/*.json` — one JSON file per store/venue, containing an array of events.
- In DEV mode, events are loaded via Vite's `import.meta.glob` (local files). In PROD, they're fetched from the GitHub API (raw content from `pavelbier/swu-events` main branch).
- The Pinia store (`src/stores/eventsStore.js`) is the single source of truth. It loads raw events, expands recurring events, and provides filtered/sorted getters.
- URL query params (`date`, `types`, `distance`, `lat`, `lng`) sync bidirectionally with store state, enabling shareable links.

**Key components:**
- `MapView` — Leaflet map with CartoDB dark tiles, distance circle, geolocation, and event markers
- `EventPanel` — card grid showing events for the selected day, backfilled with nearby upcoming events
- `EventFilters` — type checkboxes and distance slider
- `TimelineMonth` — horizontal scrollable calendar strip at the bottom

**Event data format** (in JSON files):
- One-off events: `{ title, type, dateFrom, dateTo, location: { city, place, lat, lng }, url?, description? }`
- Recurring events: same but with `recurrence: { startDate, endDate, frequency, duration, excludeDates?, dateOverrides? }` instead of `dateFrom/dateTo`. The store expands these into individual event instances.
- Event types: `weekly`, `showdown`, `prerelease`, `planetary`, `tournament`

**Path alias:** `@` maps to `src/` (configured in vite.config.js).

**dayjs setup** (`src/dayjs.js`): Extends dayjs with `isBetween` plugin and sets Czech locale. Always import dayjs from `@/dayjs`, not directly from `dayjs`.
