<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import moment from "moment-hijri";

const date = ref("");
const hijri = ref("");
const currentTime = ref("");
let midnightTimeout = null;
let updateInterval = null;

// Update the current time (every second)
function updateTime() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

// Update the date (both Gregorian and Hijri)
function updateDate() {
  const now = new Date();
  date.value = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // Set locale to English and calculate the Hijri date
  moment.locale("en");
  const hijriDate = moment(now).format("iD iMMMM iYYYY");
  hijri.value = hijriDate;
}

// Schedule a refresh at midnight to update the date
function scheduleMidnightRefresh() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const msUntilMidnight = tomorrow - now;

  midnightTimeout = setTimeout(() => {
    updateDate();
    updateTime();
    // Reschedule the refresh for the next midnight
    scheduleMidnightRefresh();
  }, msUntilMidnight);
}

onMounted(() => {
  updateDate();
  updateTime();
  scheduleMidnightRefresh();
  updateInterval = setInterval(() => {
    updateTime();
  }, 1000);
});

onUnmounted(() => {
  if (updateInterval) clearInterval(updateInterval);
  if (midnightTimeout) clearTimeout(midnightTimeout);
});
</script>

<template>
  <header>
    <div class="header-row">
      <div class="header-section logo-container">
        <img src="../assets/logo-full.svg" alt="Masjidly" class="logo" />
        <span></span>
      </div>
      <div class="header-section date-container" v-if="date && hijri">
        <span>{{ date }} | {{ hijri }}</span>
      </div>
      <div class="header-section time-container" v-if="currentTime">
        <span class="time">{{ currentTime }}</span>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
@import "../styles/stylesetter";

header {
  padding: $padding-medium;
  background: $color-primary;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
  }

  .header-section {
    flex: 1;
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 $padding-small;

    span {
      color: $color-accent;
    }
  }

  .logo-container {
    justify-content: flex-start;
    gap: 16px;

    img {
      height: 70px;
      width: auto;
    }

    span {
      font-size: $font-size-xlarge;
      font-weight: $font-weight-bold;
      color: $color-accent;
      margin: 0;
      padding: 0;
      line-height: 0;
      position: relative;
      top: 15px;
    }
  }

  .date-container {
    justify-content: center;
    flex-grow: 2;

    span {
      font-size: $font-size-xxlarge;
      color: $color-secondary;
      font-weight: $font-weight-extra-bold;
    }
  }

  .time-container {
    justify-content: flex-end;

    .time {
      font-size: $font-size-xxxxlarge;
      font-weight: $font-weight-extra-bold;
      color: $color-accent;
    }
  }

  @media (max-width: $breakpoint-desktop) {
    height: 70px;
    padding: 0 12px;

    .header-section {
      padding: 0 8px;
    }

    .logo-container {
      img {
        height: 40px;
      }

      span {
        font-size: $font-size-medium;
      }
    }

    .date-container span {
      font-size: $font-size-medium;
    }

    .time-container .time {
      font-size: 2.2rem;
    }
  }

  @media (max-width: $breakpoint-mobile) {
    height: auto;
    padding: 12px;

    .header-row {
      flex-direction: column;
      gap: 12px;
    }

    .header-section {
      padding: 0;
    }

    .logo-container {
      order: 1;
      justify-content: center;
      gap: 12px;

      img {
        height: 56px;
      }
    }

    .date-container {
      order: 1;
      justify-content: center;

      span {
        font-size: $font-size-small;
        top: 10px;
      }
    }

    .time-container {
      order: 2;
      justify-content: center;

      .time {
        font-size: 2.4rem;
      }
    }
  }
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
