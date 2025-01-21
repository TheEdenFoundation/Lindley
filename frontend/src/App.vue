<script setup>
import TimeTable from "./components/TimeTable.vue";
import Date from "./components/Date.vue";
import News from "./components/News.vue";
</script>

<template>
  <div class="tv-display">
    <Date class="date-component" />
    <div class="tv-display__body">
      <TimeTable class="timetable-component" />
      <News class="news-component" />
    </div>
  </div>
</template>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Segoe UI", sans-serif;
  background: #f5f5f5;
  overflow: hidden;

  @media (max-width: 1024px) {
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
    gap: 24px;
    padding: 24px;
    height: calc(100vh - 6rem);

    .timetable-component,
    .news-component {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      padding: 24px;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .timetable-component {
      flex: 4;
    }

    .news-component {
      flex: 6;
    }

    @media (max-width: 1024px) {
      flex-direction: column;
      height: auto;
      min-height: calc(100vh - 180px);

      .timetable-component {
        height: auto;
        min-height: 400px;
      }

      .news-component {
        height: auto;
        min-height: 600px;
      }
    }

    @media (max-width: 768px) {
      padding: 16px;
      gap: 16px;

      .timetable-component {
        min-height: 350px;
      }

      .news-component {
        min-height: 500px;
      }
    }
  }
}

// Scrollbar styling
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
