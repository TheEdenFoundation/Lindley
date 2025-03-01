<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import moment from "moment-hijri";
import { processDailyPrayer } from "../utils/salaahUtils.js";
import { fetchData } from "../utils/apiUtils.js";
import { getWeekRange } from "../utils/dateUtils.js";

const sehriEndTime = ref("");
const iftarTime = ref("");
const tomorrowSehriEndTime = ref("");
const tomorrowIftarTime = ref("");

// Fetch actual Sehri and Iftar times
const fetchRamadanTimes = async () => {
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
    const data = await fetchData(url, import.meta.env.VITE_STRAPI_API_TOKEN);

    const todaysRecord = data.data.find(
      (record) => record.date === moment().format("YYYY-MM-DD")
    );

    if (todaysRecord) {
      const prayers = processDailyPrayer(todaysRecord);

      const sehriPrayer = prayers.find((prayer) => prayer.Name === "Sehri End");
      const maghribPrayer = prayers.find((prayer) => prayer.Name === "Maghrib");

      sehriEndTime.value = sehriPrayer ? sehriPrayer["Start Time (24hr)"] : "";
      iftarTime.value = maghribPrayer ? maghribPrayer["Jamat Time (24hr)"] : "";
    }
  } catch (error) {
    console.error("Error fetching Ramadan times:", error);
  }
};

// Update Ramadan time to tomorrow's after Maghrib
const updateRamadanTimes = async () => {
  const now = new Date();
  const iftar = iftarTime.value.split(":");
  const maghribTime = new Date();
  maghribTime.setHours(iftar[0], iftar[1], 0, 0);

  if (now >= maghribTime) {
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split("T")[0];

    const queryParams = new URLSearchParams({
      "filters[date][$gte]": tomorrowISO,
      "filters[date][$lte]": tomorrowISO,
      populate: "*",
    });
    const url = `${
      import.meta.env.VITE_STRAPI_URL
    }/api/salaah-times?${queryParams}`;

    try {
      const data = await fetchData(url, import.meta.env.VITE_STRAPI_API_TOKEN);

      const tomorrowRecord = data.data.find(
        (record) => record.date === tomorrowISO
      );

      if (tomorrowRecord) {
        const prayers = processDailyPrayer(tomorrowRecord);

        const tomorrowSehriPrayer = prayers.find(
          (prayer) => prayer.Name === "Sehri End"
        );
        tomorrowSehriEndTime.value = tomorrowSehriPrayer
          ? tomorrowSehriPrayer["Start Time (24hr)"]
          : "";
        sehriEndTime.value = tomorrowSehriEndTime.value;

        const tomorrowMaghribPrayer = prayers.find(
          (prayer) => prayer.Name === "Maghrib"
        );
        tomorrowIftarTime.value = tomorrowMaghribPrayer
          ? tomorrowMaghribPrayer["Jamat Time (24hr)"]
          : "";
        iftarTime.value = tomorrowIftarTime.value;
      }
    } catch (error) {
      console.error("Error fetching tomorrow's Sehri time:", error);
    }
  }
};

onMounted(() => {
  fetchRamadanTimes();
  const interval = setInterval(updateRamadanTimes, 1000);
  onUnmounted(() => clearInterval(interval));
});
</script>

<template>
  <div class="ramadan-times">
    <h3>Ramadan Timings</h3>
    <div class="timings">
      <p>Sehri: {{ sehriEndTime }}</p>
      <p>Iftar: {{ iftarTime }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../styles/stylesetter";

.ramadan-times {
  background: $color-success;
  padding: 0.5rem;
  border-radius: 8px;
  margin-top: 1rem;

  h3 {
    font-size: $font-size-xlarge;
    font-weight: $font-weight-normal;
  }
}

.timings {
  display: flex;
  justify-content: center;
  gap: 2rem;
  font-size: $font-size-xxlarge;
  font-weight: $font-weight-bold;
}

.timings p {
  margin: 0;
  padding: 0 1rem;
}
</style>
