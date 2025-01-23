<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";

const nextPrayer = ref({
  name: "",
  time: "",
});

const timeUntil = ref("");

function calculateNextPrayer(prayerTimes) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  let nextPrayerTime = null;
  let nextPrayerName = "";

  //   console.log("All prayer times:", prayerTimes);

  // Filter to only include actual prayers with times
  const validPrayers = prayerTimes.filter(
    (prayer) =>
      prayer["Start Time"] &&
      (prayer.Name.includes("tomorrow") || prayer.Name.includes("today")) &&
      prayer.Name !== "Sunrise tomorrow" &&
      !prayer.Name.includes("T00:00") // Exclude date entries
  );

  //   console.log("Valid prayers after filtering:", validPrayers);

  for (const prayer of validPrayers) {
    // Extract time from the datetime string
    const timeStr = prayer["Start Time"].split("T")[1].substring(0, 5);
    const [hours, minutes] = timeStr.split(":");
    const prayerMinutes = parseInt(hours) * 60 + parseInt(minutes);

    // console.log("Checking prayer:", {
    //   name: prayer.Name,
    //   time: timeStr,
    //   prayerMinutes,
    //   currentTime,
    //   isNext: prayerMinutes > currentTime,
    // });

    if (prayerMinutes > currentTime) {
      nextPrayerTime = timeStr;
      // Extract just the prayer name without "tomorrow" or "today"
      nextPrayerName = prayer.Name.split(" ")[0];
      //   console.log("Found next prayer:", { nextPrayerName, nextPrayerTime });
      break;
    }
  }

  // If no next prayer found today, get first prayer of next day
  if (!nextPrayerTime && validPrayers.length > 0) {
    const firstPrayer = validPrayers[0];
    const timeStr = firstPrayer["Start Time"].split("T")[1].substring(0, 5);
    nextPrayerTime = timeStr;
    nextPrayerName = firstPrayer.Name.split(" ")[0];
    // console.log("Using first prayer of next day:", {
    //   nextPrayerName,
    //   nextPrayerTime,
    // });
  }

  const result = {
    name: nextPrayerName,
    time: nextPrayerTime || "",
  };

  //   console.log("Final result:", result);
  return result;
}

function updateTimeUntil() {
  if (!nextPrayer.value.time) return;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Safely split the time string
  const [hours = "0", minutes = "0"] = (nextPrayer.value.time || "").split(":");
  const prayerTime = parseInt(hours) * 60 + parseInt(minutes);

  let diff = prayerTime - currentTime;
  if (diff < 0) diff += 24 * 60; // Add 24 hours if prayer is tomorrow

  const hoursUntil = Math.floor(diff / 60);
  const minutesUntil = diff % 60;

  timeUntil.value = `${hoursUntil}h ${minutesUntil}m`;
}

// Update the countdown every minute
let intervalId;

onMounted(async () => {
  try {
    const response = await fetch(import.meta.env.VITE_GOOGLE_TIMETABLE_API_URL);
    if (!response.ok) throw new Error("Failed to fetch data");
    const data = await response.json();
    nextPrayer.value = calculateNextPrayer(data.data);
    updateTimeUntil();

    // Set up the interval
    intervalId = setInterval(updateTimeUntil, 60000);
  } catch (error) {
    console.error("Error fetching next prayer:", error);
  }
});

// Clean up interval on component unmount
onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<template>
  <div class="next-prayer">
    <div class="next-prayer__content">
      <div class="next-prayer__label">Next Prayer</div>
      <div class="next-prayer__info">
        <span class="prayer-name">{{ nextPrayer.name }}</span>
        <span class="time-until">{{ timeUntil }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.next-prayer {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 12px 24px;
  width: 100%;

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 4px;
  }

  &__label {
    font-size: 1.1rem;
    color: #666;
    text-transform: uppercase;
    font-weight: 600;
  }

  &__info {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 24px;

    .prayer-name {
      font-size: 2rem;
      font-weight: 700;
      color: #2d3748;
    }

    .time-until {
      font-size: 1.8rem;
      font-weight: 600;
      color: #4a5568;
    }
  }

  @media (max-width: 768px) {
    padding: 10px 16px;

    &__label {
      font-size: 1rem;
    }

    &__info {
      gap: 16px;

      .prayer-name {
        font-size: 1.6rem;
      }

      .time-until {
        font-size: 1.4rem;
      }
    }
  }
}
</style>
