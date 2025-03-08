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

/** MAIN STATES **/
const weekData = ref([]);
const finalArray = ref([]);
const tomorrowData = ref([]);
const nextPrayerName = ref("");
const nextPrayerCountdown = ref("");
const currentPrayerName = ref("");
const loading = ref(true);
const error = ref(null);

/** INTERVAL / TIMEOUT HANDLES **/
let updateInterval = null;
let midnightTimeout = null;

/** 1) FETCH current Sunday–Saturday from Strapi */
async function fetchWeekData() {
  loading.value = true;
  error.value = null;

  try {
    const { startISO, endISO } = getWeekRange();
    const queryParams = new URLSearchParams({
      "filters[date][$gte]": startISO,
      "filters[date][$lte]": endISO,
      populate: "*",
    });
    const url = `${
      import.meta.env.VITE_STRAPI_URL
    }/api/salaah-times?${queryParams}`;
    const data = await fetchData(url, import.meta.env.VITE_STRAPI_API_TOKEN);
    weekData.value = data.data || [];
    buildTodaysData();
  } catch (err) {
    error.value = err.message;
    console.error("Error fetching week data:", err);
  } finally {
    loading.value = false;
  }
}

/** 3) Always fetch tomorrow's date from Strapi */
async function fetchTomorrowData() {
  loading.value = true;
  error.value = null;

  try {
    const tomorrowISO = getTomorrowISO();
    const url = `${
      import.meta.env.VITE_STRAPI_URL
    }/api/salaah-times?filters[date][$eq]=${tomorrowISO}&populate=*`;
    const data = await fetchData(url, import.meta.env.VITE_STRAPI_API_TOKEN);
    tomorrowData.value = processTomorrowsPrayer(data.data?.[0]);
  } catch (err) {
    tomorrowData.value = [];
    error.value = err.message;
    console.error("Error fetching tomorrow data:", err);
  } finally {
    loading.value = false;
  }
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

  const todaysRecord = weekData.value.find((r) => r?.date === todayISO);
  const dailyPrayers = processDailyPrayer(todaysRecord);

  const updatedPrayers = dailyPrayers.map((prayer, index) => {
    const timeStr = prayer["Jamat Time (24hr)"] || prayer["Start Time (24hr)"];
    if (!timeStr) {
      return prayer;
    }

    // Convert prayer time into seconds (24-hour format)
    const [hh, mm] = timeStr.split(":").map(Number);
    const prayerSec = hh * 3600 + mm * 60;

    // Check if the prayer has passed
    if (prayerSec + 300 < currentSec) {
      if (tomorrowData.value[index]) {
        return tomorrowData.value[index];
      }
    }

    return prayer;
  });

  finalArray.value = updatedPrayers.filter(
    (prayer) => prayer.Name !== "Sehri End" && prayer.Name !== "Jummah"
  );

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
      :tomorrowData="tomorrowData"
    />

    <div v-if="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>
  </section>
</template>

<style scoped>
.error {
  color: red;
  text-align: center;
}
</style>
