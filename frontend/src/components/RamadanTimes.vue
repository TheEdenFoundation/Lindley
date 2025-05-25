<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import moment from "moment-hijri";
import { usePrayerTimesStore } from "../stores/prayerTimes";

const store = usePrayerTimesStore();
const sehriEndTime = ref("");
const iftarTime = ref("");
const sehriLabel = ref("Sehri End Today");
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

const updateTimesFromStore = (type = "both", forTomorrow = false) => {
  const prayers = forTomorrow ? store.tomorrowData : store.originalTodayData;

  if (type === "both" || type === "sehri") {
    const sehriPrayer = prayers.find((prayer) =>
      prayer.Name.includes("Sehri End")
    );
    sehriEndTime.value = convertTo12Hour(
      sehriPrayer?.["Start Time (24hr)"] || ""
    );
    sehriLabel.value = forTomorrow ? "Sehri End Tomorrow" : "Sehri End Today";
  }

  if (type === "both" || type === "iftar") {
    const iftarPrayer = prayers.find((prayer) =>
      prayer.Name.includes("Maghrib")
    );
    iftarTime.value = convertTo12Hour(iftarPrayer?.["Jamat Time (24hr)"] || "");
    iftarLabel.value = forTomorrow ? "Iftar Tomorrow" : "Iftar Today";
  }
};

const updateRamadanTimes = () => {
  const now = new Date();
  if (!iftarTime.value || !sehriEndTime.value) {
    if (store.originalTodayData.length > 0) {
      updateTimesFromStore("both", false);
    }
    return;
  }

  // Check Sehri time
  const sehriMatch = sehriEndTime.value.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (sehriMatch) {
    let [sHours, sMinutes, sPeriod] = sehriMatch.slice(1);
    sHours = parseInt(sHours, 10);
    sMinutes = parseInt(sMinutes, 10);
    if (sPeriod.toUpperCase() === "PM" && sHours < 12) sHours += 12;
    if (sPeriod.toUpperCase() === "AM" && sHours === 12) sHours = 0;

    const sehriTime = new Date();
    sehriTime.setHours(sHours, sMinutes, 0, 0);

    if (now >= sehriTime) {
      updateTimesFromStore("sehri", true);
    }
  }

  // Check Maghrib time
  const maghribMatch = iftarTime.value.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (maghribMatch) {
    let [mHours, mMinutes, mPeriod] = maghribMatch.slice(1);
    mHours = parseInt(mHours, 10);
    mMinutes = parseInt(mMinutes, 10);
    if (mPeriod.toUpperCase() === "PM" && mHours < 12) mHours += 12;
    if (mPeriod.toUpperCase() === "AM" && mHours === 12) mHours = 0;

    const maghribTime = new Date();
    maghribTime.setHours(mHours, mMinutes, 0, 0);

    if (now >= maghribTime && !isUpdatedToTomorrow) {
      isUpdatedToTomorrow = true;
      updateTimesFromStore("iftar", true);
    }
  }
};

const resetUpdateFlag = () => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    isUpdatedToTomorrow = false;
    updateTimesFromStore("both", false);
  }
};

watch(
  () => store.originalTodayData,
  (newData) => {
    if (newData.length > 0) {
      updateTimesFromStore("both", false);
    }
  },
  { deep: true }
);

watch(
  () => store.tomorrowData,
  (newData) => {
    if (newData.length > 0 && isUpdatedToTomorrow) {
      updateTimesFromStore("both", true);
    }
  },
  { deep: true }
);

onMounted(() => {
  if (store.originalTodayData.length > 0) {
    updateTimesFromStore("both", false);
  }
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
    <div class="timings">
      <p class="sehri-label">{{ sehriLabel }}: {{ sehriEndTime }}</p>
      <p class="iftar-label">{{ iftarLabel }}: {{ iftarTime }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../styles/stylesetter";

.ramadan-times {
  background: $color-success;
  padding: 0.7rem;
  border-radius: 8px;
  margin-top: 0.4rem;
}

.timings {
  display: flex;
  justify-content: center;
  gap: 2rem;
  font-size: $font-size-xxxlarge;
  font-weight: $font-weight-extra-bold;

  @media (max-width: $breakpoint-tablet) {
    flex-direction: column;
    gap: 0.5rem;
    font-size: calc($font-size-medium + 0.1rem);
  }

  @media (max-width: $breakpoint-tablet) {
    flex-direction: column;
    gap: 0.5rem;
    font-size: calc($font-size-medium + 0.1rem);
  }
}

.timings p {
  margin: 0;
  padding: 0 1rem;
}
</style>
