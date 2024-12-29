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
  display: flex;
  width: 60%;
  height: auto;
  align-items: center;
}

.news-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  text-align: center;
  gap: 1rem;

  figure {
    margin: 0;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  h3 {
    margin-top: 1rem;
    font-size: 3rem;
  }

  p {
    max-width: 75%;
    margin-top: 0.5rem;
    font-size: 2.1rem;
    padding: 0 3rem;
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
