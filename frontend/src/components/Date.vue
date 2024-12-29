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
    <div class="logo-container">
      <img
        src="../assets/logo.svg"
        alt="Madni Jamia Masjid Logo"
        class="logo"
      />
      <span>Madni Jamia Masjid</span>
    </div>
    <div class="date-time-container" v-if="date && hijri">
      <span class="date-time-container__time">{{ currentTime }}</span>
      <div class="date-time-container__date">
        <span>{{ date }}</span>
        <span>{{ hijri }}</span>
      </div>
    </div>
    <div v-else class="skeleton-date-time">
      <div class="skeleton-time"></div>
      <div class="skeleton-date">
        <div class="skeleton-date-item"></div>
        <div class="skeleton-date-item"></div>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  height: 150px; /* Set the header height to 10% of the viewport height */
  width: 100%;
  background-color: #faf0e6;

  .date-time-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 60%;
    text-align: center;
    gap: 1rem;
    height: 100%; /* Make the date-time container fill the header height */
    border-left: solid 1px black;

    span {
      display: block;
      color: black;
      margin: 0;
      padding: 0 2rem;
    }

    &__date {
      display: flex;
      flex-direction: column;
      font-size: 2.3rem;
      font-weight: bold;
      align-items: flex-end;
    }

    &__time {
      font-size: 4rem;
      font-weight: bold;
      text-transform: uppercase;
    }
  }

  .logo-container {
    display: flex;
    width: 40%;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    height: 100%;

    img {
      width: 100%;
      max-width: 120px;
      height: auto;
    }

    span {
      font-size: 2rem;
      font-weight: bold;
    }
  }

  .skeleton-date-time {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 60%;
    padding: 0 2rem;
    text-align: center;
    gap: 1rem;
    height: 100%;
    border-left: solid 1px black;

    .skeleton-time {
      width: 50%;
      height: 4rem;
      background-color: #f0f0f0;
      animation: skeleton-loading 1.5s infinite;
    }

    .skeleton-date {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      width: 50%;
      gap: 1rem;

      .skeleton-date-item {
        width: 80%;
        height: 2.3rem;
        background-color: #f0f0f0;
        animation: skeleton-loading 1.5s infinite;
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
