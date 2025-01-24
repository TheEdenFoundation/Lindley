<script setup>
import SalaahView from './views/SalaahView.vue'
import Date from "./components/Date.vue";
import News from "./components/News.vue";
</script>

<template>
  <div class="tv-display">
    <Date class="date-component" />
    <div class="tv-display__body">
      <div class="tv-display__main">
        <SalaahView class="timetable-component" />
        <News class="news-component" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 
   1) Large screens: no scroll, hidden overflow.
   2) Mobile/tablet (<= 1024px): auto scroll.
*/
body {
  font-family: "Segoe UI", sans-serif;
  background: #f5f5f5;
  overflow: hidden; /* Large screens: no scroll by default */

  @media (max-width: 1024px) {
    /* On mobile/tablet, allow body to scroll if needed */
    overflow: auto;
  }
}

.tv-display {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 1920px;
  margin: 0 auto;

  .date-component {
    width: 100%;
    background: #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px;
    height: calc(100vh - 6rem);
    overflow: hidden; /* Prevent overflow to avoid extra space */

    /* Adjust to ensure both components are visible */
    @media (max-width: 1024px) {
      height: auto; /* Allow full height on mobile */
    }
  }

  &__main {
    display: flex;
    gap: 24px;
    flex: 1;
    min-height: 0;
    overflow: hidden; /* No scroll in main for large screens */

    .timetable-component,
    .news-component {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      padding: 24px;
      display: flex;
      flex-direction: column;
      overflow: hidden; /* For large screens, hidden */
    }

    .timetable-component {
      flex: 4;
      height: 100%; /* Ensure it takes full height */

      /* On mobile/tablet, each section is full screen (100vh) and scrollable */
      @media (max-width: 1024px) {
        min-height: 100%; /* Ensure both components are fully visible */
      }
    }

    .news-component {
      flex: 6;
      display: block; /* or flex, your choice */
      padding: 10px;
    }

    @media (max-width: 1024px) {
      flex-direction: column;
      height: auto; /* Allow full height on mobile */
    }
  }

  @media (max-width: 768px) {
    &__body {
      padding: 16px;
      gap: 16px;
    }

    &__main {
      flex-direction: column;
      gap: 16px;
    }
  }
}

/* Scrollbar styling (seen on mobile/tablet because overflow=auto there) */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
