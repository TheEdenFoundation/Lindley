<template>
  <section class="salaah-view">
    <NextPrayer :nextName="nextPrayerName" :nextCountdown="nextPrayerCountdown" />
    <Timetable :prayers="finalArray" :activeName="currentPrayerName" />
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

// Import child components
import NextPrayer from "../components/NextPrayer.vue";
import Timetable from "../components/Timetable.vue";

// Reactive state
const weekData = ref([]);
const finalArray = ref([]);

// Next prayer states
const nextPrayerName = ref("");
const nextPrayerCountdown = ref("");

// Current prayer state (which row is "active")
const currentPrayerName = ref("");

let updateInterval = null;

/** Sunday → Saturday date range (YYYY-MM-DD) */
function getWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
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

/** Fetch SalaahTimes from Strapi for this week */
async function fetchWeekData() {
  const { startISO, endISO } = getWeekRange();
  const queryParams = new URLSearchParams({
    "filters[date][$gte]": startISO,
    "filters[date][$lte]": endISO,
    populate: "*",
  });

  const url = `${import.meta.env.VITE_STRAPI_URL}/api/salaah-times?${queryParams}`;

  try {
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_STRAPI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    if (!resp.ok) throw new Error(`HTTP Error: ${resp.status}`);
    const data = await resp.json();
    weekData.value = data.data || [];
    buildTodaysData();
  } catch (err) {
    weekData.value = [];
  }
}

/** Build final array for today's prayers + Jummah */
function buildTodaysData() {
  const todayISO = new Date().toISOString().split("T")[0];
  const todaysRecord = weekData.value.find((r) => r?.date === todayISO);
  const fridayRecord = weekData.value.find((r) => {
    const d = new Date(r?.date || "");
    return d.getDay() === 5; // Friday
  });

  const dailyPrayers = processDailyPrayers(todaysRecord);
  const jummahRow = processJummah(fridayRecord);
  finalArray.value = [...dailyPrayers, jummahRow];

  findNextAndCurrentPrayer();
}

/** Convert the 'today' record into an array of standard prayers */
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

  return prayers.map((prayer) => {
    const st = item[prayer.start] || "";
    const jt = prayer.jamat ? item[prayer.jamat] || "" : null;
    return {
      Name: prayer.name,
      "Start Time": st.slice(0, 5),
      "Jamat Time": jt ? jt.slice(0, 5) : jt,
    };
  });
}

/** Convert the Friday record into a "Jummah" row */
function processJummah(entry) {
  if (!entry) {
    return { Name: "Jummah", "Start Time": "", "Jamat Time": "" };
  }
  const item = entry;
  return {
    Name: "Jummah",
    "Start Time": item.jummah_1 ? item.jummah_1.slice(0, 5) : "",
    "Jamat Time": item.jummah_2 ? item.jummah_2.slice(0, 5) : "",
  };
}

/** Find next + current prayer, setting nextPrayerName, nextPrayerCountdown, currentPrayerName */
function findNextAndCurrentPrayer() {
  const now = new Date();
  const currentSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  let nextPrayer = null;
  let activePrayer = null;

  // Convert times to seconds
  const prayersWithSec = finalArray.value.map((p) => {
    const timeStr = p["Start Time"];
    if (!timeStr) return { ...p, sec: null };
    const [hh, mm] = timeStr.split(":");
    const s = parseInt(hh, 10) * 3600 + parseInt(mm, 10) * 60;
    return { ...p, sec: s };
  });

  // Next prayer = first that is in the future
  for (const p of prayersWithSec) {
    if (p.sec != null && p.sec > currentSec) {
      nextPrayer = p;
      break;
    }
  }
  // If none left, next = first (tomorrow)
  if (!nextPrayer && prayersWithSec.length > 0) {
    nextPrayer = prayersWithSec[0];
  }

  // Active prayer: if p[i].sec <= now < p[i+1].sec
  for (let i = 0; i < prayersWithSec.length; i++) {
    const pSec = prayersWithSec[i].sec;
    if (pSec == null) continue;
    const nextSec = prayersWithSec[i + 1]?.sec;
    if (!nextSec) {
      // Past last
      if (pSec <= currentSec) {
        activePrayer = prayersWithSec[i];
      }
    } else {
      if (pSec <= currentSec && currentSec < nextSec) {
        activePrayer = prayersWithSec[i];
        break;
      }
    }
  }

  currentPrayerName.value = activePrayer?.Name || "";

  // next prayer
  if (!nextPrayer) {
    nextPrayerName.value = "No upcoming prayers";
    nextPrayerCountdown.value = "";
  } else {
    nextPrayerName.value = nextPrayer.Name;
    let diff = (nextPrayer.sec ?? 0) - currentSec;
    if (diff < 0) diff += 24 * 3600;
    nextPrayerCountdown.value = formatCountdown(diff);
  }
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

/** onMounted => fetch data + start interval */
onMounted(() => {
  fetchWeekData();
  updateInterval = setInterval(() => {
    findNextAndCurrentPrayer();
  }, 1000);
});

/** Cleanup */
onUnmounted(() => {
  if (updateInterval) clearInterval(updateInterval);
});
</script>

<style scoped>
.salaah-view {
  /* Container styling if needed */
}
</style>
