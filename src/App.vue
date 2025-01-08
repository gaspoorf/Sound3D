<template>
  <div id="app">
    <LoadingScreen  @loaded="loading = false" />

    <div class="scene" ref="threeContainer">
    
      <div :class="['search-container', { 'search-top-left': hasSearched }]" ref="myDiv">
        <input v-model="query" @keyup.enter="search(query)" placeholder="Rechercher un artiste, une chanson" />
        <button @click="search(query)" class="search-btn"><img src="@/assets/img/search-icon.svg"></button>
      </div>

      <div v-if="tracks.length === 0 && query !== ''">
        <p>Recherche en cours...</p>
      </div>

      <ThreeExperience ref="threeExperience" :tracks="tracks" :key="tracks.length" />
    </div>
  </div>
</template>

<script>
import * as THREE from 'three';
import axios from 'axios';
import ThreeExperience from './components/ThreeExperience.vue';
import LoadingScreen from './components/LoadingScreen.vue';
import gsap from 'gsap';

export default {
  components: {
    ThreeExperience,
    LoadingScreen,
  },
  data() {
    return {
      loading: true,
      hasSearched: false,
      tracks: [],
      query: '', // Le modèle pour la recherche
      scene: null, // La scène pour Three.js
      camera: null, // La caméra pour Three.js
      isMoved: false,
    };
  },
  mounted() {
    // Utilisez $nextTick pour s'assurer que le DOM est prêt avant d'appeler initThree
    this.$nextTick(() => {
      this.initThree();
    });
  },
  watch: {
    hasSearched(newVal) {
      if (newVal) {
        this.animateDiv(); // Lancer l'animation
      }
    },
  },
  methods: {
    async search(query) {
      try {
        // Arrêtez les sons en cours
        if (this.$refs.threeExperience) {
          this.$refs.threeExperience.stopAllSounds();
        }

        this.tracks = [];
        const response = await axios.get(`https://sound3d.vercel.app/api/search?q=${query}`);
        this.tracks = response.data.data;
        this.hasSearched = true;
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      }
    },

    animateDiv() {
      const div = this.$refs.myDiv;
      gsap.to(div, { duration: 0.5, opacity: 0, onComplete: () => {
        gsap.set(div, { top: '1rem', left: '1rem', transform: 'translate(0, 0)' });
        gsap.to(div, { duration: 0.5, opacity: 1, delay: 5 });
      }});
    },


    initThree() {
      const container = this.$refs.threeContainer;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Assurez-vous que container est défini avant de continuer
      if (!container) {
        console.error("Le conteneur threeContainer est introuvable.");
        return;
      }

      if (this.$refs.threeExperience) {
        this.$refs.threeExperience.firstAnimation();
      }

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      this.camera.position.set(100, 0, 2050);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      // Ajout d'une lumière et d'un point lumineux
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      this.scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xffffff, 1);
      pointLight.position.set(10, 10, 10);
      this.scene.add(pointLight);

      // Animation de la scène
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(this.scene, this.camera);
      };
      animate();
    },
  },
};
</script>