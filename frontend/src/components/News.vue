<script setup>
import { ref, onMounted } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";
import "swiper/swiper-bundle.css";
import axios from "axios";

const newsItems = ref([]);
const currentBackgroundColor = ref("");
const loading = ref(true);
const error = ref(null);

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

    console.log("Slideshow data:", response.data);

    newsItems.value = response.data.data.map((item) => ({
      image: `${import.meta.env.VITE_STRAPI_URL}${item.image.url}`,
    }));

    console.log("Slideshow images fetched:", newsItems.value);
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
    <div v-else class="skeleton-news">
      <div class="skeleton-image"></div>
    </div>
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
        object-fit: contain;
        border-radius: 8px;
      }
    }
  }

  @media (max-width: $breakpoint-desktop) {
    aspect-ratio: 16/9;
    height: 100%;

    .news-item figure img {
      object-fit: cover;
    }
  }

  @media (max-width: $breakpoint-mobile) {
    min-height: 400px;

    .news-item {
      padding: $padding-small 0;
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

.error {
  color: red;
  text-align: center;
}
</style>
