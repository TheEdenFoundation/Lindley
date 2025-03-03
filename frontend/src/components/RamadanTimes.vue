<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import moment from "moment-hijri";
import {
  processDailyPrayer,
  processTomorrowsPrayer,
} from "../utils/salaahUtils.js";
import { fetchData } from "../utils/apiUtils.js";

const sehriEndTime = ref("");
const iftarTime = ref("");
const sehriLabel = ref("Sehri Today");
const iftarLabel = ref("Iftar Today");
let isUpdatedToTomorrow = false;

const convertTo12Hour = (time24) => {
  if (!time24 || time24.trim() === "") return "";
  const [hours, minutes] = time24.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return "";
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
};

const fetchRamadanTimes = async (forTomorrow = false) => {
  const date = forTomorrow
    ? moment().add(1, "day").format("YYYY-MM-DD")
    : moment().format("YYYY-MM-DD");

  const queryParams = new URLSearchParams({
    "filters[date][$eq]": date,
    populate: "*",
  });
  const url = `${
    import.meta.env.VITE_STRAPI_URL
  }/api/salaah-times?${queryParams}`;

  try {
    const data = await fetchData(url, import.meta.env.VITE_STRAPI_API_TOKEN);
    const record = data.data.find((rec) => rec.date === date);
    if (record) {
      const prayers = forTomorrow
        ? processTomorrowsPrayer(record)
        : processDailyPrayer(record);
      const sehriPrayer = prayers.find((prayer) =>
        prayer.Name.includes("Sehri End")
      );
      const iftarPrayer = prayers.find((prayer) =>
        prayer.Name.includes("Maghrib")
      );

      sehriEndTime.value = convertTo12Hour(
        sehriPrayer?.["Start Time (24hr)"] || ""
      );
      iftarTime.value = convertTo12Hour(
        iftarPrayer?.["Jamat Time (24hr)"] || ""
      );

      sehriLabel.value = forTomorrow ? "Sehri End Tomorrow" : "Sehri End Today";
      iftarLabel.value = forTomorrow ? "Iftar Tomorrow" : "Iftar Today";

      // Force a check to see if we need to switch to tomorrow
      if (!forTomorrow) {
        updateRamadanTimes();
      }
    } else {
      console.warn(`No data found for ${forTomorrow ? "tomorrow" : "today"}.`);
    }
  } catch (error) {
    console.error(
      `Error fetching ${forTomorrow ? "tomorrow's" : "today's"} Ramadan times:`,
      error
    );
  }
};

const updateRamadanTimes = () => {
  const now = new Date();
  if (!iftarTime.value) {
    fetchRamadanTimes();
    return;
  }
  const match = iftarTime.value.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) {
    return;
  }

  let [hours, minutes, period] = match.slice(1);
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);
  if (period.toUpperCase() === "PM" && hours < 12) hours += 12;
  if (period.toUpperCase() === "AM" && hours === 12) hours = 0;

  const maghribTime = new Date();
  maghribTime.setHours(hours, minutes, 0, 0);

  if (now >= maghribTime && !isUpdatedToTomorrow) {
    isUpdatedToTomorrow = true;
    fetchRamadanTimes(true);
  }
};

const resetUpdateFlag = () => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    isUpdatedToTomorrow = false;
    fetchRamadanTimes().then(() => {
      sehriLabel.value = "Sehri End Today";
      iftarLabel.value = "Iftar Today";
    });
  }
};

onMounted(() => {
  fetchRamadanTimes();
  updateRamadanTimes(); // Check immediately if Maghrib has passed
  const interval = setInterval(updateRamadanTimes, 1000);
  const resetInterval = setInterval(resetUpdateFlag, 1000);
  onUnmounted(() => {
    clearInterval(interval);
    clearInterval(resetInterval);
  });
});
</script>

<template>
  <div class="ramadan-times">
    <h3>Ramadhan Timings</h3>
    <div class="timings">
      <p>{{ sehriLabel }}: {{ sehriEndTime }}</p>
      <p>{{ iftarLabel }}: {{ iftarTime }}</p>
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
