<template>
  <div class="next-prayer">
    <h2 class="next-prayer__title">
      Next Prayer:
      <span v-if="nextName !== 'No upcoming prayers'">
        {{ nextName }} <span>in</span> {{ nextCountdown }}
      </span>
      <span v-else>{{ nextName }}</span>
    </h2>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  nextName: { type: String, default: "No upcoming prayers" },
  nextCountdown: { type: String, default: "" }
})
</script>

<style scoped lang="scss">
@import '../_stylesetter.scss';

.next-prayer {
  background: #c6f6d5; /* light green */
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  padding: 16px 24px;
  margin-bottom: 16px;

  &__title {
    font-size: 2rem;
    color: #2f855a;
    font-weight: bold;

    @media (max-width: $breakpoint-tablet) {
      font-size: 1.1rem;
    }
    span {
      font-weight: normal;
    }
  }
}
</style>
