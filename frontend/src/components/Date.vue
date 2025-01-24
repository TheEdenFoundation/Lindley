<script setup>
import { onMounted, ref } from "vue";

const date = ref("");
const hijri = ref("");
const currentTime = ref("");

function updateTime() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

onMounted(async () => {
  try {
    const response = await fetch(import.meta.env.VITE_GOOGLE_TIMETABLE_API_URL);
    if (!response.ok) throw new Error("Failed to fetch data");

    const data = await response.json();
    const formatDate = new Date(data.data[0].Name);
    date.value = formatDate.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    hijri.value = `${data.data[1].Name}`;
  } catch (error) {
    console.error("Error fetching timetable:", error);
  }

  updateTime();
  setInterval(updateTime, 1000);
});
</script>

<template>
  <header>
    <div class="header-row">
      <div class="header-section logo-container">
        <img
          src="../assets/logo.svg"
          alt="Madni Jamia Masjid Logo"
          class="logo"
        />
        <span>Madni Jamia Masjid</span>
      </div>
      <div class="header-section date-container" v-if="date && hijri">
        <span>{{ date }} | {{ hijri }}</span>
      </div>
      <div class="header-section time-container" v-if="date && hijri">
        <span class="time">{{ currentTime }}</span>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
@import '../_stylesetter.scss'; // Adjust the path as necessary

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
  }

  .logo-container {
    justify-content: flex-start;
    gap: 16px;

    img {
      height: 50px;
      width: auto;
    }

    span {
      font-size: $font-size-large;
      font-weight: $font-weight-bold;
      color: $color-accent;
    }
  }

  .date-container {
    justify-content: center;

    span {
      font-size: $font-size-large;
      color: $color-secondary;
      font-weight: $font-weight-bold;
    }
  }

  .time-container {
    justify-content: flex-end;

    .time {
      font-size: 2.5rem;
      font-weight: $font-weight-bold;
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
      font-size: $font-size-small;
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
        height: 36px;
      }

      span {
        font-size: $font-size-small;
      }
    }

    .date-container {
      order: 1;
      justify-content: center;

      span {
        font-size: $font-size-small;
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
