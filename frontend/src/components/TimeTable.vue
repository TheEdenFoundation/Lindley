<script setup>
import { onMounted, ref, computed } from "vue";

const times = ref([]);
const currentTime = ref(new Date());

async function fetchTimetable() {
  try {
    const response = await fetch(import.meta.env.VITE_GOOGLE_TIMETABLE_API_URL);
    if (!response.ok) throw new Error("Failed to fetch data");
    const data = await response.json();

    const filteredData = data.data.filter((entry) =>
      [
        "Fajr today",
        "Fajr tomorrow",
        "Sunrise today",
        "Sunrise tomorrow",
        "Zohar today",
        "Zohar tomorrow",
        "Asar today",
        "Asar tomorrow",
        "Maghrib today",
        "Maghrib tomorrow",
        "Isha today",
        "Isha tomorrow",
        "Jummah Khutbah",
      ].includes(entry.Name)
    );

    times.value = filteredData;
    console.log("Data fetched at:", new Date().toLocaleTimeString());

    // Schedule the next page reload based on Jamat times
    scheduleNextReload();
  } catch (error) {
    console.error("Error fetching timetable:", error);
  }
}

function scheduleNextReload() {
  const now = new Date();
  const currentTime = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const jamatTimes = times.value
    .filter((entry) => entry["Jamat Time"])
    .map((entry) => {
      const [, time] = entry["Jamat Time"].split("T");
      return time.slice(0, 8); // Extract the time portion in "HH:mm:ss" format
    });

  console.log("Current time:", currentTime); // Log the current time

  let nextReloadTime = null;

  for (const jamatTime of jamatTimes) {
    const [hours, minutes, seconds] = jamatTime.split(":");
    const reloadTime = new Date(now);
    reloadTime.setHours(hours);
    reloadTime.setMinutes(minutes);
    reloadTime.setSeconds(seconds);
    reloadTime.setMilliseconds(0);

    if (reloadTime < now) {
      reloadTime.setDate(reloadTime.getDate() + 1); // If the reload time is earlier than the current time, set it to the next day
    }

    reloadTime.setMinutes(reloadTime.getMinutes() + 5); // Add 5 minutes to the reload time
    if (nextReloadTime === null || reloadTime < nextReloadTime) {
      nextReloadTime = reloadTime;
    }
  }

  if (nextReloadTime) {
    const delay = nextReloadTime - now;
    console.log(
      "Next reload scheduled at:",
      nextReloadTime.toLocaleTimeString()
    ); // Log the next reload time
    setTimeout(() => {
      location.reload();
    }, delay);
  } else {
    console.log("No reload scheduled."); // Log if no reload is scheduled
  }
}

const formattedTimes = computed(() => {
  return times.value.map((entry) => {
    const formattedStartTime = formatTime(entry["Start Time"]);
    const formattedJamatTime = formatTime(entry["Jamat Time"]);
    return {
      ...entry,
      "Start Time": formattedStartTime,
      "Jamat Time": formattedJamatTime,
    };
  });
});

console.log(formattedTimes);

function formatTime(timeString) {
  if (!timeString) return "";

  const [hours, minutes] = timeString.split("T")[1].split(":");
  const hour = parseInt(hours, 10);
  const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${formattedHour}:${minutes}`;
}

onMounted(() => {
  fetchTimetable(); // Fetch immediately on mount
  setInterval(() => {
    currentTime.value = new Date(); // Update current time every second
  }, 1000);
});
</script>

<template>
  <div class="timetable-container">
    <div v-if="formattedTimes.length" class="timetable">
      <div class="timetable__header">
        <span class="name-column"></span>
        <span class="time-column">Start Time</span>
        <span class="time-column">Jamat Time</span>
      </div>
      <ul class="timetable__list">
        <li
          v-for="time in formattedTimes"
          :key="time.id"
          :class="{
            jummah: time.Name === 'Jummah Khutbah',
          }"
        >
          <span class="name-column">{{ time.Name.split(" ")[0] }}</span>
          <template v-if="time['Start Time'] && !time['Jamat Time']">
            <span class="time-column full-width">{{ time["Start Time"] }}</span>
          </template>
          <template v-else-if="time['Start Time'] === time['Jamat Time']">
            <span class="time-column full-width">{{ time["Jamat Time"] }}</span>
          </template>
          <template v-else>
            <span class="time-column">{{ time["Start Time"] }}</span>
            <span class="time-column">{{ time["Jamat Time"] }}</span>
          </template>
        </li>
      </ul>
    </div>
    <div v-else class="skeleton-table">
      <div class="skeleton-row" v-for="i in 5" :key="i">
        <div class="skeleton-cell skeleton-name"></div>
        <div class="skeleton-cell skeleton-time"></div>
        <div class="skeleton-cell skeleton-time"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.timetable-container {
  height: 100%;
  padding: 16px;
  display: flex;

  .timetable {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;

    &__header {
      display: flex;
      padding: 12px 16px;
      color: #666;
      font-size: 1.2rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 16px;

      .name-column {
        width: 40%;
        text-align: left;
      }

      .time-column {
        flex: 1;
        text-align: center;
      }
    }

    &__list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: space-between;

      li {
        display: flex;
        align-items: center;
        background: #f8f9fa;
        border-radius: 8px;
        padding: 20px 16px;
        font-size: 1.6rem;
        transition: background-color 0.2s ease;

        &.jummah {
          background: #fff3cd;
          color: #856404;
        }

        .name-column {
          width: 40%;
          font-weight: 600;
          color: #2d3748;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .time-column {
          flex: 1;
          text-align: center;
          color: #4a5568;
          font-weight: 700;

          &.full-width {
            flex: 2;
          }
        }
      }
    }
  }

  .skeleton-table {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .skeleton-row {
      display: flex;
      gap: 8px;
      flex: 1;

      .skeleton-cell {
        background: #f0f0f0;
        height: 48px;
        border-radius: 8px;
        animation: skeleton-loading 1.5s infinite;

        &.skeleton-name {
          width: 40%;
        }

        &.skeleton-time {
          width: 30%;
        }
      }
    }
  }

  @media (max-width: 1024px) {
    .timetable {
      &__header {
        font-size: 1.1rem;
        padding: 8px;
      }

      &__list li {
        font-size: 1.4rem;
        padding: 16px;
      }
    }
  }
}
</style>
