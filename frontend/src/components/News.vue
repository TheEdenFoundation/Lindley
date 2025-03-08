<script setup>
import { ref, onMounted, computed } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";
import RamadanTimes from "../components/RamadanTimes.vue";
import "swiper/swiper-bundle.css";
import axios from "axios";
import moment from "moment-hijri";

const newsItems = ref([]);
const currentBackgroundColor = ref("");
const loading = ref(true);
const error = ref(null);
const isRamadan = ref(false);

const checkRamadan = () => {
  moment.locale("en");
  const hijriDate = moment().format("iMMMM");
  isRamadan.value = hijriDate === "Ramadhan";
};
checkRamadan();

setInterval(checkRamadan, 1000);

async function fetchSlideshow() {
  loading.value = true;
  error.value = null;

  try {
    const response = await axios.get(
      `${import.meta.env.VITE_STRAPI_URL}/api/announcements?populate=image`,
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_STRAPI_API_TOKEN}`,
        },
      }
    );

    newsItems.value = response.data.data.map((item) => ({
      image: `${item.image.url}`,
    }));
  } catch (err) {
    error.value = err.message;
    console.error("Error fetching slideshow data:", err);
  } finally {
    loading.value = false;
  }
}

const onSlideChange = (swiper) => {
  const activeIndex = swiper.realIndex;
  if (newsItems.value[activeIndex]) {
    currentBackgroundColor.value = newsItems.value[activeIndex].background;
  }
};

const swiperConfig = {
  autoplay: {
    delay: 10000,
    disableOnInteraction: false,
  },
  loop: true,
  slidesPerView: 1,
  modules: [Autoplay],
};

onMounted(fetchSlideshow);
</script>

<template>
  <div
    class="news-container"
    :style="{ backgroundColor: currentBackgroundColor }"
  >
    <div v-if="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <Swiper
      :class="{ 'ramadan-news': isRamadan }"
      v-else-if="newsItems.length"
      v-bind="swiperConfig"
      @slideChange="onSlideChange"
    >
      <SwiperSlide v-for="(item, index) in newsItems" :key="index">
        <div class="news-item">
          <figure class="news-image">
            <img :src="item.image" :alt="item.title" />
          </figure>
        </div>
      </SwiperSlide>
    </Swiper>
    <div v-else :class="{ 'ramadan-news': isRamadan }" class="skeleton-news">
      <div class="skeleton-image"></div>
    </div>
    <RamadanTimes />
  </div>
</template>

<style lang="scss" scoped>
@import "../styles/stylesetter";

.news-container {
  height: 100%;
  position: relative;
  border-radius: $border-radius;
  overflow: hidden;

  .swiper {
    height: 100%;
  }

  .news-item {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    figure {
      width: 100%;
      height: 100%;
      margin: 0;

      img {
        width: 100%;
        height: 100%;
        border-radius: 8px;
      }
    }
  }

  .ramadan-news {
    height: 90%;
  }
}

.skeleton-news {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;

  .skeleton-image {
    width: 100%;
    height: 100%;
    background-color: #f0f0f0;
    animation: skeleton-loading 1.5s infinite;
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

.error {
  color: red;
  text-align: center;
}
</style>
