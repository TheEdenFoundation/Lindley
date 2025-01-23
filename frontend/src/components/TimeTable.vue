<script setup>
import { ref, onMounted } from "vue";

/** Reactive state **/
const weekData = ref([]);
const finalArray = ref([]);

/** Calculate Sunday → Saturday (YYYY-MM-DD) */
function getWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon,...,6=Sat

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startISO = startOfWeek.toISOString().split("T")[0];
  const endISO = endOfWeek.toISOString().split("T")[0];
  return { startISO, endISO };
}

/** Fetch all SalaahTimes within Sunday–Saturday */
async function fetchWeekData() {
  const { startISO, endISO } = getWeekRange();
  const queryParams = new URLSearchParams({
    "filters[date][$gte]": startISO,
    "filters[date][$lte]": endISO,
    populate: "*",
  });

  const url = `${
    import.meta.env.VITE_STRAPI_URL
  }/api/salaah-times?${queryParams}`;
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

/** Build final array for today's prayers + Jummah from Friday */
function buildTodaysData() {
  const todayISO = new Date().toISOString().split("T")[0];
  const todaysRecord = weekData.value.find((r) => r?.date === todayISO);
  const fridayRecord = weekData.value.find((r) => {
    const d = new Date(r?.date || "");
    return d.getDay() === 5; // 5=Friday
  });

  const dailyPrayers = processDailyPrayers(todaysRecord);
  const jummahRow = processJummah(fridayRecord);

  finalArray.value = [...dailyPrayers, jummahRow];
}

/** Parse daily prayers from 'todaysRecord' */
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

/** Parse jummah times from the Friday record */
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

/** On mount, fetch the data for this week */
onMounted(() => {
  fetchWeekData();
});
</script>

<template>
  <div class="timetable-container">
    <div v-if="finalArray.length" class="timetable">
      <div class="timetable__header">
        <span class="name-column"></span>
        <span class="time-column">Start</span>
        <span class="time-column">Jamat</span>
      </div>
      <ul class="timetable__list">
        <li
          v-for="(row, index) in finalArray"
          :key="index"
          :class="{ jummah: row.Name === 'Jummah' }"
        >
          <span class="name-column">{{ row.Name }}</span>

          <!-- If only one time is present -->
          <template v-if="row['Start Time'] && !row['Jamat Time']">
            <span class="time-column full-width">{{ row["Start Time"] }}</span>
          </template>

          <!-- If both times exist & are same -->
          <template
            v-else-if="
              row['Start Time'] === row['Jamat Time'] && row['Start Time']
            "
          >
            <span class="time-column full-width">{{ row["Start Time"] }}</span>
          </template>

          <!-- Otherwise, show both -->
          <template v-else>
            <span class="time-column">{{ row["Start Time"] }}</span>
            <span class="time-column">{{ row["Jamat Time"] }}</span>
          </template>
        </li>
      </ul>
    </div>
    <div v-else class="no-data">
      <p>No data found for this week or today.</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.timetable-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;

  .timetable {
    display: flex;
    flex-direction: column;
    width: 100%;

    &__header {
      display: flex;
      padding: 12px 16px;
      color: #666;
      font-size: 1.2rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 8px;

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

      li {
        display: flex;
        align-items: center;
        background: #f8f9fa;
        border-radius: 8px;
        padding: 13px;
        font-size: 1.6rem;
        margin-bottom: 8px;
        transition: background-color 0.2s ease;

        &.jummah {
          background: #fff3cd;
          color: #856404;
        }

        .name-column {
          width: 40%;
          font-weight: 600;
          color: #2d3748;
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

  .no-data {
    text-align: center;
    padding: 30px;
    font-size: 1.4rem;
    color: #666;
  }
}

/* MOBILE-FRIENDLY */
@media (max-width: 600px) {
  .timetable__header {
    display: none; /* hide the header row on mobile for more space */
  }

  .timetable__list li {
    flex-wrap: wrap;
    font-size: 1.4rem;

    .name-column {
      width: 100%;
      text-align: left;
      margin-bottom: 6px;
    }
    .time-column {
      width: 50%;
      margin-bottom: 6px;
      text-align: center;
    }
    .time-column.full-width {
      width: 100%;
    }
  }
}
</style>
