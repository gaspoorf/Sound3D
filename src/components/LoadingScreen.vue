<template>
  <div :class="['loading-screen', { 'loading-screen-display': isLoading }]">
    <div class="audio-instruction">
    <p>Activer l'audio pour une meilleure expérience</p>
    </div>
    <div class="loading-progress">
      <p>{{ progress }}%</p>
    </div>
  </div>
</template>

<script>
import "@/assets/css/loading.scss";
export default {
  data() {
    return {
      progress: 0,
      isLoading: true,
    };
  },
  methods: {
    simulateLoading() {
      const interval = setInterval(() => {
        if (this.progress < 100) {
          this.progress += 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            this.isLoading = false;
            this.$emit('loaded');
          }, 1000);
        }
      }, 50);
    },
  },
  mounted() {
    this.simulateLoading();
  },
};
</script>
