<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import NextPrayer from "../components/NextPrayer.vue";
import TimeTable from "../components/TimeTable.vue";
import {
  processDailyPrayer,
  processTomorrowsPrayer,
  formatCountdown,
} from "../utils/salaahUtils.js";
import { getWeekRange, getTomorrowISO } from "../utils/dateUtils.js";
import { fetchData } from "../utils/apiUtils.js";
import { processJummah } from "../utils/prayerUtils.js";
import { usePrayerTimesStore } from "../stores/prayerTimes";

/** MAIN STATES **/
const finalArray = ref([]);
const nextPrayerName = ref("");
const nextPrayerCountdown = ref("");
const currentPrayerName = ref("");

const store = usePrayerTimesStore();

/** INTERVAL / TIMEOUT HANDLES **/
let updateInterval = null;
let midnightTimeout = null;

/** 1) FETCH current Sunday–Saturday from Strapi */
async function fetchWeekData() {
  await store.fetchWeekData();
  buildTodaysData();
}

/** 3) Always fetch tomorrow's date from Strapi */
async function fetchTomorrowData() {
  await store.fetchTomorrowData();
}

/**
 * Find next & current prayer, updating nextPrayerName,
 * nextPrayerCountdown
 */
function findNextAndCurrentPrayer() {
  const now = new Date();
  const currentSec =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  let nextPrayer = null;

  const prayersWithSec = finalArray.value.map((p) => {
    const time24 = p["Start Time (24hr)"];
    if (!time24) return { ...p, sec: null };
    const [hh, mm] = time24.split(":");
    const s = parseInt(hh, 10) * 3600 + parseInt(mm, 10) * 60;
    return { ...p, sec: s };
  });

  for (const p of prayersWithSec) {
    if (p.sec != null && p.sec > currentSec) {
      nextPrayer = p;
      break;
    }
  }

  if (!nextPrayer && prayersWithSec.length > 0) {
    nextPrayer = prayersWithSec[0];
  }

  if (!nextPrayer) {
    nextPrayerName.value = "No upcoming prayers";
    nextPrayerCountdown.value = "";
  } else {
    nextPrayerName.value = nextPrayer.Name;
    let diff = (nextPrayer.sec ?? 0) - currentSec;
    if (diff < 0) diff += 24 * 3600;
    nextPrayerCountdown.value = formatCountdown(diff);
  }

  currentPrayerName.value = nextPrayer?.Name || "";
}

function buildTodaysData() {
  const now = new Date();
  const currentSec =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const todayISO = now.toISOString().split("T")[0];

  const todaysRecord = store.weekData.find((r) => r?.date === todayISO);
  const fridayRecord = store.weekData.find((r) => {
    const d = new Date(r?.date || "");
    return d.getDay() === 5;
  });

  const dailyPrayers = processDailyPrayer(todaysRecord);
  const jummahRow = processJummah(fridayRecord);

  // Store the original prayers first
  const originalPrayers = [...dailyPrayers];
  store.setTodayData(
    [...originalPrayers, jummahRow], // original data
    [] // updated data (will be set below)
  );

  const updatedPrayers = dailyPrayers.map((prayer, index) => {
    // Don't update Sehri End time to tomorrow's time
    if (prayer.Name === "Sehri End") {
      return prayer;
    }

    const timeStr = prayer["Jamat Time (24hr)"] || prayer["Start Time (24hr)"];
    if (!timeStr) {
      return prayer;
    }

    // Convert prayer time into seconds (24-hour format)
    const [hh, mm] = timeStr.split(":").map(Number);
    const prayerSec = hh * 3600 + mm * 60;

    // Check if the prayer has passed
    if (prayerSec + 300 < currentSec) {
      if (store.tomorrowData[index]) {
        return store.tomorrowData[index];
      }
    }

    return prayer;
  });

  // Update the store with both original and updated data
  store.setTodayData(
    [...originalPrayers, jummahRow],
    [...updatedPrayers, jummahRow]
  );

  // Filter out Sehri End for display
  finalArray.value = updatedPrayers
    .filter((prayer) => prayer.Name !== "Sehri End")
    .concat(jummahRow);

  findNextAndCurrentPrayer();
}

/** Schedule a refresh of weekData at midnight */
function scheduleMidnightRefresh() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const msUntilMidnight = tomorrow - now;

  midnightTimeout = setTimeout(() => {
    fetchWeekData();
    fetchTomorrowData();
    scheduleMidnightRefresh();
  }, msUntilMidnight);
}

onMounted(() => {
  fetchWeekData();
  fetchTomorrowData();
  scheduleMidnightRefresh();

  updateInterval = setInterval(() => {
    buildTodaysData();
    findNextAndCurrentPrayer();
  }, 1000);
});

onUnmounted(() => {
  if (updateInterval) clearInterval(updateInterval);
  if (midnightTimeout) clearTimeout(midnightTimeout);
});
</script>

<template>
  <section class="salaah-view">
    <NextPrayer
      :nextName="nextPrayerName"
      :nextCountdown="nextPrayerCountdown"
    />
    <TimeTable
      :prayers="finalArray"
      :activeName="currentPrayerName"
      :tomorrowData="store.tomorrowData"
    />

    <div v-if="store.loading">Loading...</div>
    <div v-if="store.error" class="error">{{ store.error }}</div>
  </section>
</template>

<style scoped>
.error {
  color: red;
  text-align: center;
}
</style>
