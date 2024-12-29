<script setup>
import TimeTable from "./components/TimeTable.vue";
import Date from "./components/Date.vue";
import News from "./components/News.vue";
</script>

<template>
  <div class="tv-display">
    <Date class="date-component" />
    <section class="tv-display__body">
      <TimeTable class="timetable-component" />
      <News class="news-component" />
    </section>
  </div>
</template>

<style lang="scss">
.tv-display {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  height: 100vh;

  &__body {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    height: 100%;
  }
}
</style>
