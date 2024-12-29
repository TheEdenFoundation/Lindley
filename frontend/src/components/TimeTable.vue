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
    <table v-if="formattedTimes.length">
      <thead>
        <tr>
          <th></th>
          <th>Start Time</th>
          <th>Jamat Time</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="time in formattedTimes"
          :key="time.id"
          :class="{
            jummah: time.Name === 'Jummah Khutbah',
          }"
        >
          <td class="name">{{ time.Name }}</td>
          <td
            v-if="time['Start Time'] && !time['Jamat Time']"
            class="jamat"
            colspan="2"
          >
            {{ time["Start Time"] }}
          </td>
          <td
            v-else-if="time['Start Time'] === time['Jamat Time']"
            class="jamat"
            colspan="2"
          >
            {{ time["Jamat Time"] }}
          </td>
          <td
            v-else-if="time['Start Time'] !== time['Jamat Time']"
            class="start"
            :class="time.Name === 'Jummah Khutbah' ? 'jummah' : ''"
          >
            {{ time["Start Time"] }}
          </td>
          <td
            v-if="time['Start Time'] !== time['Jamat Time']"
            class="jamat"
            :class="time.Name === 'Jummah Khutbah' ? 'jummah' : ''"
          >
            {{ time["Jamat Time"] }}
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="skeleton-table">
      <div class="skeleton-row" v-for="i in 5" :key="i">
        <div class="skeleton-cell skeleton-name"></div>
        <div class="skeleton-cell skeleton-start-time"></div>
        <div class="skeleton-cell skeleton-jamat-time"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.timetable-container {
  display: flex;
  width: 40%;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;

  table {
    width: 100%;
    height: auto;
    border-collapse: collapse;
    background: #2d9159;
    color: white;

    thead {
      tr {
        th {
          font-size: 1.8rem;
          padding-top: 2rem;
        }
      }
    }

    tbody {
      tr {
        td {
          font-size: 2.7rem;
          text-align: center;
        }

        &.jummah {
          background-color: #ffad1f; /* Change the color as desired */
        }

        .jamat-only {
          text-align: center;
        }
      }
    }
  }

  .skeleton-table {
    width: 100%;
    height: auto;
    background-color: #f0f0f0;
    animation: skeleton-loading 1.5s infinite;
    margin: 2rem;
  }
}

.name,
.jamat,
.jummah {
  font-weight: bold;
}

@keyframes skeleton-loading {
  0% {
    background-color: #f0f0f0;
  }
  50% {
    background-color: #e0e0e0;
  }
  100% {
    background-color: #f0f0f0;
  }
}
</style>
