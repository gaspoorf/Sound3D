<template>
  <div :class="['loading-screen', { 'loading-screen-display': isLoading }]">
    <div class="loading-progress">
      <p>{{ progress }}%</p>
    </div>
  </div>
</template>

<script>
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

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: end;
  align-items: end;
  background-color: #000000;
  color: white;
  z-index: 999;
  font-size: 5rem;
  font-weight: bold;
  opacity: 0;
  transition: opacity 1s ease-in-out;
  pointer-events: none;

  &.loading-screen-display {
    opacity: 1;
    pointer-events: all;
  }
}

.loading-progress {
  text-align: center;
  position: absolute;
  bottom: 2rem;
  right: 5rem;

  p{
    margin: 0;
  }
}


</style>
