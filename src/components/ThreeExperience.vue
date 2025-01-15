<template>
  <div class="three-container" ref="threeContainer"></div>
  <div class="info-container" ref="infoContainer"></div>
</template>

<script>
import * as THREE from "three";
import gsap from "gsap";
import { watch } from "vue";
import "@/assets/css/scene.scss";
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export default {
  props: {
    tracks: Array,
  },
  data() {
    return {
      cameraAnimationInProgress: false,
      targetZ: 2500,
      model: null,
      firstAnim: true,
    };
  },
  mounted() {
    this.initThree();
    this.loadModel();
    this.$nextTick(() => {
      this.onWindowResize(); // Appeler explicitement onWindowResize
    });
    window.addEventListener('resize', this.onWindowResize);
    watch(
      () => this.tracks,
      (newTracks) => {
        if (newTracks.length > 0 && !this.animationStarted) {
          this.animationStarted = true;
          this.tracksTrue = true;
          // console.log("Animation started due to tracks update.");

          // animation de la caméra
          gsap.to(this.camera.position, {
            x: 0,
            y: 0,
            z: 750,
            duration: 6,
            ease: "power2.out",
            onStart: () => {
              this.cameraAnimationInProgress = true;
            },
            onComplete: () => {
              this.cameraAnimationInProgress = false;
              this.targetZ = 750;
              this.currentZ = this.targetZ;
            }
          });

          gsap.to(this.camera.rotation, {
            x: 0,
            y: 0,
            z: 0,
            duration: 5,
            ease: "power2.out",
          });
        }
      },
      { immediate: true }
    );
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onWindowResize);
    this.cleanUp();
  },
  methods: {
    stopAllSounds() {
      this.sounds.forEach((sound) => {
        if (sound.isPlaying) {
          sound.stop();
        }
      });
      this.sounds = []; // nettoyer la liste des sons
    },

    
    firstAnimation() {
      // Premiere animation 
      // console.log("first anim started");
      setTimeout(() => {
        gsap.to(this.camera.position, {
          x: 200,
          y: 0,
          z: 750,
          duration: 7,
          ease: "power2.inOut",
          onStart: () => {
            this.cameraAnimationInProgress = true;
          },
          onComplete: () => {
            this.cameraAnimationInProgress = false;
            this.targetZ = 750;
            this.currentZ = this.targetZ;
          },
        });
      }, 6500);
      

      // Animation/Appariton barre de recherche
      const searchContainer = document.querySelector(".search-container");
      if (searchContainer) {
        gsap.set(searchContainer, { y: 50, opacity: 0 });
        setTimeout(() => {
          gsap.to(searchContainer, { duration: 2, ease: "power2.inOut", y: 0, opacity: 1 });
        }, 12000);
      }    
    },

    // Charger un modèle STL
    loadModel() {
      const loader = new STLLoader();
    
      loader.load('/model/sphere.stl', (geometry) => {
        // charger environnement hdr
        const envLoader = new RGBELoader();
        envLoader.load('/texture/space.hdr', (hdrEquirect) => {
          const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
          const envMap = pmremGenerator.fromEquirectangular(hdrEquirect).texture;
          this.scene.environment = envMap;
        });
    
        // matériau métallique
        const material = new THREE.MeshStandardMaterial({
          color: 0xaaaaaa,
          metalness: 1,   
          roughness: 0.2,
          envMapIntensity: 1,
        });
    
        // creation modèle 3D avec le matériau
        const model = new THREE.Mesh(geometry, material);
    
        model.rotation.x = Math.PI / 2;
        model.scale.set(7, 7, 7);
        model.position.set(0, 20, 750);

        if (this.tracksTrue){
          model.position.set(0, 0, 0);
          model.scale.set(5, 5, 5);
        }
    
        this.scene.add(model);
        this.model = model;
    
        // maj de la matrice
        model.updateMatrix();
      }, undefined, (error) => {
        console.error("Erreur de chargement du modèle:", error);
      });
    },

    onWindowResize() {
      const container = this.$refs.threeContainer;
  
      // Vérifiez les dimensions du conteneur pour éviter les erreurs
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
  
      // Ajuster la caméra
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
  
      // Ajuster le renderer
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(window.devicePixelRatio);
    },
    
    initThree() {
      this.sounds = [];
      const container = this.$refs.threeContainer;
      const infoContainer = this.$refs.infoContainer;
      const width = container.clientWidth;
      const height = container.clientHeight;

      const scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      this.camera.position.set(200, 0, 2500);

      // rotation initiale
      const euler = new THREE.Euler(
        THREE.MathUtils.degToRad(0),
        THREE.MathUtils.degToRad(90),
        THREE.MathUtils.degToRad(0)
      );
      this.camera.quaternion.setFromEuler(euler);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      // configuration particules
      const particleCount = 50000;
      const radiusTop = 200;
      const radiusBottom = 1;
      const particlesHeight = 10000;
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const velocities = [];

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * (radiusTop - radiusBottom) + radiusBottom;
        const y = (Math.random() - 0.5) * particlesHeight;

        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        positions.push(x, y, z);
        velocities.push((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));

      const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        opacity: 0.9
      });

      const particles = new THREE.Points(geometry, material);
      particles.rotation.x = Math.PI / 2;
      particles.position.z = -2000;
      scene.add(particles);

      //animation des particules
      const animateParticles = () => {
        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.geometry.attributes.velocity.array;

        for (let i = 0; i < particleCount * 3; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];

          const radius = Math.sqrt(positions[i] * positions[i] + positions[i + 2] * positions[i + 2]);
          if (radius > radiusTop) {
            const angle = Math.random() * 2 * Math.PI;
            positions[i] = radiusTop * Math.cos(angle);
            positions[i + 2] = radiusTop * Math.sin(angle);
          }
          if (positions[i + 1] > particlesHeight / 2 || positions[i + 1] < -particlesHeight / 2) {
            positions[i + 1] = (Math.random() - 0.5) * particlesHeight;
          }
        }

        particles.geometry.attributes.position.needsUpdate = true;
      };       

      // Lumières
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xffffff, 1);
      pointLight.position.set(10, 10, 10);
      scene.add(pointLight);


      // ajout des pochettes d'albums
      const textureLoader = new THREE.TextureLoader();
      const albumMeshes = [];
      const sounds = [];

      const listener = new THREE.AudioListener();
      this.camera.add(listener);

      this.tracks.forEach((track, index) => {
        const texture = textureLoader.load(track.album.cover_xl);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

        const material = new THREE.MeshBasicMaterial({ 
          map: texture, 
          side: THREE.DoubleSide 
        });

        const geometry = new THREE.PlaneGeometry(5, 5);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, 720 - index * 25);
        scene.add(mesh);
        albumMeshes.push(mesh);

        
        const sound = new THREE.Audio(listener);
        const audioUrl = `https://sound3d.vercel.app/api/audio?url=${encodeURIComponent(track.preview)}`;

        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(audioUrl, (buffer) => {
          sound.setBuffer(buffer);
          sound.setLoop(true);
          sound.setVolume(0);
          sound.play();
        });
        sounds.push(sound);
        mesh.add(sound);

        this.sounds.push(sound);

        // ajout du texte sous la pochette
        const textDiv = document.createElement("div");
        textDiv.className = "info";
        textDiv.textContent = `${track.title} - ${track.artist.name}`;
        infoContainer.appendChild(textDiv);
        mesh.userData.textDiv = textDiv;
      });

      // zoom fluide
      this.currentZ = this.camera.position.z;
      const zoomSmoothness = 0.1;

      // animation du zoom
      window.addEventListener("wheel", (event) => {
        event.preventDefault();
        this.targetZ -= event.deltaY * 0.01;
      }, { passive: false });

     

      let startY = 0;
      
      //mouvement tactile
      window.addEventListener("touchstart", (event) => {
        if (event.touches.length === 1) { 
          startY = event.touches[0].clientY;
        }
      }, { passive: false });
      
      //mouvement tactile
      window.addEventListener("touchmove", (event) => {
        if (event.touches.length === 1) {
          event.preventDefault();
      
          const currentY = event.touches[0].clientY;
          const deltaY = startY - currentY;
      
          this.targetZ += deltaY * 0.03;
          startY = currentY;
        }
      }, { passive: false });
      

      //mouvement de la souris
      const mouse = { x: 0, y: 0 };
      const targetMouse = { x: 0, y: 0 };

      window.addEventListener("mousemove", (event) => {
        targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        targetMouse.y = (event.clientY / window.innerHeight) * 2 - 1;
      });

      // Fonction principale d'animation
      const animate = () => {
        requestAnimationFrame(animate);
        animateParticles();

        // rotation model en fonction de la souris
        if (this.model) {
          this.lastRotationX = 0.01;
          this.lastRotationY = 0.01;
          this.lastRotationY = this.model.rotation.y;
          this.model.rotation.x = this.lastRotationX; 
          this.model.rotation.y = this.lastRotationY;
        }

        if (this.model) {
          this.model.rotation.x -= mouse.x * 0.01;
          this.lastRotationX = this.model.rotation.x;
          this.model.rotation.y += mouse.y * 0.01;
          
        }
      
        if (!this.cameraAnimationInProgress) {
          this.currentZ += (this.targetZ - this.currentZ) * zoomSmoothness;
          this.camera.position.z = this.currentZ;
        }

        albumMeshes.forEach((mesh, index) => {
          const distance = this.camera.position.distanceTo(mesh.position);
          const maxVolume = 1.0;
          const minVolume = 0.0;
          const falloff = 5;
          const volume = Math.max(minVolume, maxVolume * Math.exp(-distance / falloff));
          sounds[index].setVolume(volume);
        });

        let closestMesh = null;
        let closestDistance = Infinity;

        albumMeshes.forEach((mesh) => {
          const distance = Math.abs(this.camera.position.z - mesh.position.z);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestMesh = mesh;
          }
        });

        albumMeshes.forEach((mesh) => {
          const textDiv = mesh.userData.textDiv;
          if (mesh === closestMesh) {
            const vector = mesh.position.clone();
            vector.project(this.camera);
            textDiv.style.display = "flex";
          } else {
            textDiv.style.display = "none";
          }
        });

        const lerpFactor = 0.1;
        mouse.x += (targetMouse.x - mouse.x) * lerpFactor;
        mouse.y += (targetMouse.y - mouse.y) * lerpFactor;

        albumMeshes.forEach((mesh) => {
          const tiltFactor = 0.2;
          mesh.rotation.x = mouse.y * tiltFactor;
          mesh.rotation.y = mouse.x * tiltFactor;
        });

        renderer.render(scene, this.camera);
      };

      animate();
      
      //redimensionnement de la fenêtre
      window.addEventListener('resize', this.onWindowResize);

      // nettoyage
      this.scene = scene;
      this.renderer = renderer;
    },

    cleanUp() {
      this.renderer.dispose();
    },
  },
};
</script>