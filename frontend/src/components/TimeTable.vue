<script setup>
import { defineProps } from "vue";

const props = defineProps({
  prayers: { type: Array, default: () => [] },
  tomorrowData: { type: Array, default: () => [] },
});
</script>

<template>
  <div class="timetable-container">
    <div v-if="prayers.length" class="timetable">
      <div class="timetable__header">
        <span class="name-column"></span>
        <span class="time-column">Jamat</span>
      </div>
      <ul class="timetable__list">
        <li
          v-for="(row, index) in prayers"
          :key="index"
          :class="{
            jummah: row.Name === 'Jummah',
          }"
        >
          <span class="name-column">{{ row.Name }}</span>

          <!-- If only one time is present -->
          <template v-if="row['Start Time'] && !row['Jamat Time']">
            <span class="time-column full-width">{{ row["Start Time"] }}</span>
          </template>

          <!-- If both times exist & same -->
          <template
            v-else-if="
              row['Start Time'] === row['Jamat Time'] && row['Start Time']
            "
          >
            <span class="time-column full-width">{{ row["Start Time"] }}</span>
          </template>

          <!-- Otherwise, show both -->
          <template v-else>
            <span class="time-column">{{ row["Jamat Time"] }}</span>
          </template>
        </li>
      </ul>
    </div>
    <div v-else class="no-data">
      <p>No data found for this week or today.</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../styles/stylesetter";

.timetable-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  height: 100%;

  .timetable {
    display: flex;
    flex-direction: column;
    width: 100%;
    flex-grow: 1;
    height: 100%;

    &__header {
      display: flex;
      padding: 12px 16px;
      color: $color-secondary;
      font-size: $font-size-large;
      font-weight: $font-weight-bold;
      text-transform: uppercase;
      margin-bottom: 8px;

      .name-column {
        width: 75%;
      }
      .time-column {
        text-align: center;
      }
    }

    &__list {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      list-style: none;
      padding: 0;
      margin: 0;
      flex-grow: 1;

      li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #f8f9fa;
        border-radius: $border-radius;
        padding: $padding-small 45px;
        transition: background-color 0.2s ease;

        @media (max-width: $breakpoint-tablet) {
          padding: $padding-small;
          font-size: 1.3rem;
        }

        .name-column {
          width: 40%;
          text-align: left;
          font-weight: $font-weight-bold;
          color: $color-accent;
          font-size: calc($font-size-xxxlarge + 0.5rem);
        }

        .time-column {
          text-align: center;
          color: #4a5568;
          font-weight: $font-weight-extra-bold;
          font-size: calc($font-size-xxxxlarge + 0.5rem);
        }
      }
    }
  }

  .no-data {
    text-align: center;
    padding: 30px;
    font-size: 1.4rem;
    color: $color-secondary;
  }
}
</style>
