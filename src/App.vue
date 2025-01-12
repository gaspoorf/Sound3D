<template>
  <div id="app">
    <audio ref="backgroundAudio" autoplay loop>
      <source src="@/assets/audio/2step.mp3" type="audio/mp3" />
      Votre navigateur ne supporte pas l'élément audio.
    </audio>

    <LoadingScreen  @loaded="loading = false" />

    <div class="scene" ref="threeContainer">
    
      <div class="search-container">
        <input v-model="query" @keyup.enter="search(query)" placeholder="Rechercher un artiste, une chanson" />
        <button @click="query !== '' ? search(query) : null" class="search-btn"><img src="@/assets/img/search-icon.svg"></button>
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
      query: '',
      scene: null,
      camera: null,
      isMoved: false,
      audioContext: null,
      gainNode: null,
      firstSearch: true,
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.initAudio();
      this.initThree();
    });
  },
  methods: {
    async search(query) {
      try {
        // couper les sons en cours
        if (this.$refs.threeExperience) {
          this.$refs.threeExperience.stopAllSounds();
        }

        // couper les sons en cours avec fondu
        if (this.$refs.backgroundAudio) {
          this.fadeOutAudio();
        }

        this.tracks = [];
        const response = await axios.get(`https://sound3d.vercel.app/api/search?q=${query}`);
        // const response = await axios.get(`http://localhost:3000/api/search?q=${query}`);
        this.tracks = response.data.data;
        this.hasSearched = true;

        if (this.firstSearch) {
          this.animateDiv(); // Lancer l'animation
        } else {
          console.log("deuxieme recherch pas d'anim");
        }

      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      }
    },

    animateDiv() {
      const div = document.querySelector('.search-container');
      console.log("First search detected");
      gsap.to(div, { duration: 0.5, opacity: 0, onComplete: () => {
        gsap.set(div, { top: '1rem', left: '1rem', transform: 'translate(0, 0)' });
        gsap.to(div, { duration: 0.5, opacity: 1, delay: 5 });
      }});
      this.firstSearch = false;
    },

    

    initAudio() {
      const audioElement = this.$refs.backgroundAudio;
    
      if (audioElement) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioSource = this.audioContext.createMediaElementSource(audioElement);
        this.gainNode = this.audioContext.createGain();
    
        audioSource.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
    
        // volume initial
        this.gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
    
        // l'audio démarre après une interaction
        const resumeAudioContext = () => {
          if (this.audioContext.state === "suspended") {
            this.audioContext.resume();
          }
          audioElement.play();
          document.removeEventListener("click", resumeAudioContext);
          document.removeEventListener("touchstart", resumeAudioContext);
        };
    
        document.addEventListener("click", resumeAudioContext);
        document.addEventListener("touchstart", resumeAudioContext);
      }
    },
    

    fadeOutAudio() {
      if (this.$refs.backgroundAudio && this.gainNode) {
        const currentTime = this.audioContext.currentTime;
  
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0, currentTime + 6); // fade-out de 6 secondes
    
        setTimeout(() => {
          if (this.$refs.backgroundAudio) {
            this.$refs.backgroundAudio.pause();
            this.$refs.backgroundAudio.currentTime = 0;
          }
        }, 6000); // stopper complètement après 6 secondes
      } else {
        console.warn("L'élément audio est introuvable.");
      }
    }, 

    initThree() {
      const container = this.$refs.threeContainer;
      const width = container.clientWidth;
      const height = container.clientHeight;

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

      // lumière et point lumineux
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      this.scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xffffff, 1);
      pointLight.position.set(10, 10, 10);
      this.scene.add(pointLight);

      // znimation de la scène
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(this.scene, this.camera);
      };
      animate();
    },
  },
};
</script>