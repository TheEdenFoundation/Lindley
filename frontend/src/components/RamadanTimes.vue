<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import moment from "moment-hijri";
import { processDailyPrayer } from "../utils/salaahUtils.js";
import { fetchData } from "../utils/apiUtils.js";
import { getWeekRange } from "../utils/dateUtils.js";

const sehriEndTime = ref("");
const iftarTime = ref("");
const sehriLabel = ref("Sehri Today"); // Default label for today
const iftarLabel = ref("Iftar Today"); // Default label for today
const tomorrowSehriEndTime = ref("");
const tomorrowIftarTime = ref("");

// Convert 24hr time to 12hr format with AM/PM
const convertTo12Hour = (time24) => {
  if (!time24 || time24.trim() === "") return "";

  const [hours, minutes] = time24.split(":").map(Number);

  if (isNaN(hours) || isNaN(minutes)) return "";

  const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM

  return `${hours12}:${minutes.toString().padStart(2, "0")}`;
};

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

      // Store the 24-hour format for calculations
      const sehri24 = sehriPrayer ? sehriPrayer["Start Time (24hr)"] : "";
      const iftar24 = maghribPrayer ? maghribPrayer["Jamat Time (24hr)"] : "";

      // Convert to 12-hour format for display
      sehriEndTime.value = convertTo12Hour(sehri24);
      iftarTime.value = convertTo12Hour(iftar24);

      // Set the labels for today
      sehriLabel.value = "Sehri Today";
      iftarLabel.value = "Iftar Today";
    }

    // Fetch tomorrow's prayers
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split("T")[0];

    const tomorrowQueryParams = new URLSearchParams({
      "filters[date][$gte]": tomorrowISO,
      "filters[date][$lte]": tomorrowISO,
      populate: "*",
    });
    const tomorrowUrl = `${
      import.meta.env.VITE_STRAPI_URL
    }/api/salaah-times?${tomorrowQueryParams}`;

    const tomorrowData = await fetchData(
      tomorrowUrl,
      import.meta.env.VITE_STRAPI_API_TOKEN
    );
    const tomorrowRecord = tomorrowData.data.find(
      (record) => record.date === tomorrowISO
    );

    if (tomorrowRecord) {
      const tomorrowPrayers = processDailyPrayer(tomorrowRecord);

      const tomorrowSehriPrayer = tomorrowPrayers.find(
        (prayer) => prayer.Name === "Sehri End"
      );
      const tomorrowSehri24 = tomorrowSehriPrayer
        ? tomorrowSehriPrayer["Start Time (24hr)"]
        : "";
      tomorrowSehriEndTime.value = convertTo12Hour(tomorrowSehri24);

      const tomorrowMaghribPrayer = tomorrowPrayers.find(
        (prayer) => prayer.Name === "Maghrib"
      );
      const tomorrowIftar24 = tomorrowMaghribPrayer
        ? tomorrowMaghribPrayer["Jamat Time (24hr)"]
        : "";
      tomorrowIftarTime.value = convertTo12Hour(tomorrowIftar24);
    }
  } catch (error) {
    console.error("Error fetching Ramadan times:", error);
  }
};

// Update Ramadan time to tomorrow's after Maghrib
const updateRamadanTimes = async () => {
  const now = new Date();

  // Only proceed if we have a valid Iftar time
  if (!iftarTime.value) return;

  // Extract the hours and minutes from the 12-hour format
  const iftarMatch = iftarTime.value.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!iftarMatch) return;

  let hours = parseInt(iftarMatch[1]);
  const minutes = parseInt(iftarMatch[2]);
  const period = iftarMatch[3].toUpperCase();

  // Convert to 24-hour format for comparison
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  const maghribTime = new Date();
  maghribTime.setHours(hours, minutes, 0, 0);

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
        const tomorrowSehri24 = tomorrowSehriPrayer
          ? tomorrowSehriPrayer["Start Time (24hr)"]
          : "";

        const tomorrowMaghribPrayer = prayers.find(
          (prayer) => prayer.Name === "Maghrib"
        );
        const tomorrowIftar24 = tomorrowMaghribPrayer
          ? tomorrowMaghribPrayer["Jamat Time (24hr)"]
          : "";

        // Only update the displayed times and labels if we have valid data for tomorrow
        if (tomorrowSehri24 && tomorrowIftar24) {
          tomorrowSehriEndTime.value = convertTo12Hour(tomorrowSehri24);
          sehriEndTime.value = convertTo12Hour(tomorrowSehri24);

          tomorrowIftarTime.value = convertTo12Hour(tomorrowIftar24);
          iftarTime.value = convertTo12Hour(tomorrowIftar24);

          sehriLabel.value = "Sehri Tomorrow";
          iftarLabel.value = "Iftar Tomorrow";
        }
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
