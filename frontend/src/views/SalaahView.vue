<template>
  <section class="salaah-view">
    <!-- Next Prayer + Timetable (unchanged) -->
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

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import axios from "axios";
import NextPrayer from "../components/NextPrayer.vue";
import TimeTable from "../components/TimeTable.vue";

/** MAIN STATES **/
// Weekly data for the current Sunday→Saturday
const weekData = ref([]);
// Final array for "today" ( + Jummah row)
const finalArray = ref([]);

// Tomorrow's data (separate ref)
const tomorrowData = ref([]);

// Next prayer states
const nextPrayerName = ref("");
const nextPrayerCountdown = ref("");
const currentPrayerName = ref("");
const loading = ref(true);
const error = ref(null);

/** INTERVAL / TIMEOUT HANDLES **/
let updateInterval = null;
let midnightTimeout = null;

/** 1) Sunday→Saturday range (YYYY-MM-DD) */
function getWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun,...6=Sat

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return {
    startISO: startOfWeek.toISOString().split("T")[0],
    endISO: endOfWeek.toISOString().split("T")[0],
  };
}

/** 2) FETCH current Sunday–Saturday from Strapi */
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

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_STRAPI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    weekData.value = response.data.data || [];
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
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split("T")[0];

    const url = `${
      import.meta.env.VITE_STRAPI_URL
    }/api/salaah-times?filters[date][$eq]=${tomorrowISO}&populate=*`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_STRAPI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    tomorrowData.value = processTomorrowPrayers(response.data.data?.[0]);
  } catch (err) {
    tomorrowData.value = [];
    error.value = err.message;
    console.error("Error fetching tomorrow data:", err);
  } finally {
    loading.value = false;
  }
}

/** Parse tomorrow's record into the same shape as daily prayers */
function processTomorrowPrayers(entry) {
  if (!entry) {
    return [];
  }
  const item = entry;
  const prayers = [
    { name: "Fajr", start: "fajr_start", jamat: "fajr_jamat" },
    { name: "Sunrise", start: "sunrise", jamat: null },
    { name: "Zuhr", start: "zohar_start", jamat: "zohar_jamat" },
    { name: "Asr", start: "asr_start", jamat: "asr_jamat" },
    { name: "Maghrib", start: "maghrib_start", jamat: "maghrib_jamat" },
    { name: "Isha", start: "isha_start", jamat: "isha_jamat" },
  ];

  return prayers.map((pr) => ({
    Name: pr.name,
    "Start Time": item[pr.start] ? item[pr.start].slice(0, 5) : "",
    "Jamat Time": item[pr.jamat] ? item[pr.jamat].slice(0, 5) : "",
  }));
}

/** Build today's final array (+ Jummah) and include tomorrow's data for passed prayers */
function buildTodaysData() {
  const now = new Date();
  const currentSec =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const todayISO = now.toISOString().split("T")[0];

  // Find today's and Friday's records
  const todaysRecord = weekData.value.find((r) => r?.date === todayISO);
  const fridayRecord = weekData.value.find((r) => {
    const d = new Date(r?.date || "");
    return d.getDay() === 5; // Friday
  });

  const dailyPrayers = processDailyPrayers(todaysRecord);
  const jummahRow = processJummah(fridayRecord);

  // Replace passed prayers with tomorrow's data
  const updatedPrayers = dailyPrayers.map((prayer, index) => {
    // Convert prayer time to seconds
    const timeStr = prayer["Jamat Time"] || prayer["Start Time"];
    if (!timeStr) return prayer; // Skip if no time available

    const [hh, mm] = timeStr.split(":");
    const prayerSec = parseInt(hh, 10) * 3600 + parseInt(mm, 10) * 60;

    // If prayer has passed, replace with tomorrow's equivalent
    if (prayerSec + 300 < currentSec && tomorrowData.value[index]) {
      // Add 5 minutes (300 seconds) to jamat time threshold
      return tomorrowData.value[index];
    }
    return prayer;
  });

  finalArray.value = [...updatedPrayers, jummahRow];
  findNextAndCurrentPrayer();
}

/** Process daily prayers for "today" */
function processDailyPrayers(entry) {
  if (!entry) return [];
  const item = entry;
  const prayers = [
    { name: "Fajr", start: "fajr_start", jamat: "fajr_jamat" },
    { name: "Sunrise", start: "sunrise", jamat: null },
    { name: "Zuhr", start: "zohar_start", jamat: "zohar_jamat" },
    { name: "Asr", start: "asr_start", jamat: "asr_jamat" },
    { name: "Maghrib", start: "maghrib_start", jamat: "maghrib_jamat" },
    { name: "Isha", start: "isha_start", jamat: "isha_jamat" },
  ];

  return prayers.map((prayer) => ({
    Name: prayer.name,
    "Start Time": item[prayer.start] ? item[prayer.start].slice(0, 5) : "",
    "Jamat Time": item[prayer.jamat] ? item[prayer.jamat].slice(0, 5) : "",
  }));
}

/** Convert the Friday record into a "Jummah" row */
function processJummah(entry) {
  if (!entry) return { Name: "Jummah", "Start Time": "", "Jamat Time": "" };
  const item = entry;
  return {
    Name: "Jummah",
    "Start Time": item.jummah_1 ? item.jummah_1.slice(0, 5) : "",
    "Jamat Time": item.jummah_2 ? item.jummah_2.slice(0, 5) : "",
  };
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

  // convert times to seconds
  const prayersWithSec = finalArray.value.map((p) => {
    const timeStr = p["Start Time"];
    if (!timeStr) return { ...p, sec: null };
    const [hh, mm] = timeStr.split(":");
    const s = parseInt(hh, 10) * 3600 + parseInt(mm, 10) * 60;
    return { ...p, sec: s };
  });

  // next prayer = first that is in the future
  for (const p of prayersWithSec) {
    if (p.sec != null && p.sec > currentSec) {
      nextPrayer = p;
      break;
    }
  }
  // if none left, next => first (tomorrow)
  if (!nextPrayer && prayersWithSec.length > 0) {
    nextPrayer = prayersWithSec[0];
  }

  // Next prayer name & countdown
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

/** Format X seconds => "Xh Ym" or "Xm Ys" or "Xs" */
function formatCountdown(seconds) {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const remainder = seconds % 3600;
    const mins = Math.floor(remainder / 60);
    return `${hours}h ${mins}m`;
  } else if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Schedules a refresh of `weekData` at midnight
 * => re-fetch current week's data
 */
function scheduleMidnightRefresh() {
  // calc ms until midnight
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const msUntilMidnight = tomorrow - now;

  // set a timeout
  midnightTimeout = setTimeout(() => {
    console.log("It's midnight! Re-fetching weekData...");
    fetchWeekData();
    fetchTomorrowData();
    // re-schedule for next midnight
    scheduleMidnightRefresh();
  }, msUntilMidnight);
}

/** Update specific prayers that have passed with tomorrow's data */
function updatePassedPrayers() {
  const now = new Date();
  const currentSec =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  finalArray.value = finalArray.value.map((prayer) => {
    const prayerTimeStr = prayer["Start Time"];
    if (!prayerTimeStr) return prayer; // Skip if no start time

    const [hh, mm] = prayerTimeStr.split(":");
    const prayerSec = parseInt(hh, 10) * 3600 + parseInt(mm, 10) * 60;

    // Check if the prayer time has passed
    if (prayerSec <= currentSec) {
      // Find tomorrow's corresponding prayer time
      const tomorrowPrayer = tomorrowData.value.find(
        (tomorrow) => tomorrow.Name === prayer.Name
      );
      if (tomorrowPrayer) {
        // Update the prayer with tomorrow's time
        return {
          ...prayer,
          "Start Time": tomorrowPrayer["Start Time"],
          "Jamat Time": tomorrowPrayer["Jamat Time"],
        };
      } else {
      }
    } else {
    }
    return prayer; // Return unchanged prayer
  });
}

onMounted(() => {
  // Fetch week and tomorrow's data
  fetchWeekData();
  fetchTomorrowData();

  // Schedule refresh at midnight
  scheduleMidnightRefresh();

  // Update next/current prayer every second and update passed prayers every 5 minutes
  updateInterval = setInterval(() => {
    findNextAndCurrentPrayer(); // Updates next prayer and current prayer
    updatePassedPrayers(); // Ensures passed prayers are updated with tomorrow's data
  }, 1000); // Every second
});

/** Cleanup */
onUnmounted(() => {
  if (updateInterval) clearInterval(updateInterval);
  if (midnightTimeout) clearTimeout(midnightTimeout);
});
</script>

<style scoped>
.error {
  color: red;
  text-align: center;
}
</style>
