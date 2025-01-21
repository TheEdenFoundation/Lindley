<script setup>
import { ref, onMounted } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";
import "swiper/swiper-bundle.css";

const newsItems = ref([]);
const currentBackgroundColor = ref("");

async function fetchSlideshow() {
  try {
    const response = await fetch(import.meta.env.VITE_GOOGLE_SLIDESHOW_API_URL);
    if (!response.ok) throw new Error("Failed to fetch data");
    const data = await response.json();
    newsItems.value = data.data;
    console.log("Slideshow fetched at:", new Date().toLocaleTimeString());
  } catch (error) {
    console.error("Error fetching news data:", error);
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
    <Swiper
      v-if="newsItems.length"
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
    <div v-else class="skeleton-news">
      <div class="skeleton-image"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.news-container {
  height: 100%;
  position: relative;
  border-radius: 12px;
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
        object-fit: contain;
        border-radius: 8px;
      }
    }
  }

  @media (max-width: 1024px) {
    aspect-ratio: 16/9;
    height: 100%;

    .news-item figure img {
      object-fit: cover;
    }
  }

  @media (max-width: 768px) {
    min-height: 400px;

    .news-item {
      padding: 16px 0;
    }
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
</style>
