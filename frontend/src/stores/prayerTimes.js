import { defineStore } from "pinia";
import { ref } from "vue";
import { fetchData } from "../utils/apiUtils";
import { getWeekRange, getTomorrowISO } from "../utils/dateUtils";
import {
  processDailyPrayer,
  processTomorrowsPrayer,
} from "../utils/salaahUtils";

export const usePrayerTimesStore = defineStore("prayerTimes", () => {
  const weekData = ref([]);
  const originalTodayData = ref([]);
  const updatedTodayData = ref([]);
  const tomorrowData = ref([]);
  const loading = ref(false);
  const error = ref(null);

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
      return weekData.value;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching week data:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

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
      return tomorrowData.value;
    } catch (err) {
      tomorrowData.value = [];
      error.value = err.message;
      console.error("Error fetching tomorrow data:", err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  function setTodayData(original, updated) {
    originalTodayData.value = original;
    updatedTodayData.value = updated;
  }

  return {
    weekData,
    originalTodayData,
    updatedTodayData,
    tomorrowData,
    loading,
    error,
    fetchWeekData,
    fetchTomorrowData,
    setTodayData,
  };
});
