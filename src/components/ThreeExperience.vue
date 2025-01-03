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
    tracks: Array, // Les morceaux récupérés depuis l'API Deezer
  },
  data() {
    return {
      cameraAnimationInProgress: false,  // Variable pour savoir si l'animation de la caméra est en cours
      targetZ: 750,
      model: null,
    };
  },
  mounted() {
    this.initThree();
    this.loadModel();
    watch(
      () => this.tracks,
      (newTracks) => {
        if (newTracks.length > 0 && !this.animationStarted) {
          this.animationStarted = true;
          this.tracksTrue = true;
          console.log("Animation started due to tracks update.");

          // Animation de la caméra vers une nouvelle position avec GSAP
          gsap.to(this.camera.position, {
            x: 0,
            y: 0,
            z: 750,  // Position cible de la caméra
            duration: 3, // Durée de l'animation
            ease: "power2.out",  // Type de transition (accélération/décélération)
            onStart: () => {
              this.cameraAnimationInProgress = true;  // Indiquer que l'animation de la caméra a commencé
            },
            onComplete: () => {
              this.cameraAnimationInProgress = false;  // Indiquer que l'animation de la caméra est terminée
              this.targetZ = 750;
              this.currentZ = this.targetZ;
            }
          });

          gsap.to(this.camera.rotation, {
            x: 0,
            y: 0,  // Inclinaison en Y de la caméra
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
    this.cleanUp();
  },
  methods: {

    // Charger un modèle STL
    loadModel() {
      const loader = new STLLoader();
    
      loader.load('/model/sphere.stl', (geometry) => {
        // Chargement de l'environnement HDR (par exemple une image 360°)
        const envLoader = new RGBELoader();
        envLoader.load('/texture/space.hdr', (hdrEquirect) => {
          const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
          const envMap = pmremGenerator.fromEquirectangular(hdrEquirect).texture;
          this.scene.environment = envMap;  // Applique l'environnement pour les réflexions
        });
    
        // Création du matériau métallique avec réflexion
        const material = new THREE.MeshStandardMaterial({
          color: 0xaaaaaa, // Couleur métallique
          metalness: 1,    // Complètement métallique
          roughness: 0.2,  // Faible rugosité
          envMapIntensity: 1, // Réflexions basées sur l'environnement
        });
    
        // Création du modèle 3D avec le matériau
        const model = new THREE.Mesh(geometry, material);
    
        // Transformation du modèle
        model.rotation.x = Math.PI / 2;
        model.scale.set(7, 7, 7);
        model.position.set(0, 20, 750);

        if (this.tracksTrue){
          model.position.set(0, 0, 100);
          model.scale.set(5, 5, 5);
        }
    
        // Ajout à la scène
        this.scene.add(model);
    
        // Référence globale au modèle (optionnel)
        this.model = model;
    
        // Mise à jour de la matrice
        model.updateMatrix();
      }, undefined, (error) => {
        console.error("Erreur de chargement du modèle:", error);
      });
    },
    
    


    initThree() {
      const container = this.$refs.threeContainer;
      const infoContainer = this.$refs.infoContainer;
      const width = container.clientWidth;
      const height = container.clientHeight;

      const scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      this.camera.position.set(200, 0, 2050);

      // Définir rotation initiale
      const euler = new THREE.Euler(
        THREE.MathUtils.degToRad(0),  // Inclinaison X
        THREE.MathUtils.degToRad(90), // Inclinaison Y
        THREE.MathUtils.degToRad(0)   // Inclinaison Z
      );
      this.camera.quaternion.setFromEuler(euler);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      // Configuration des particules
      const particleCount = 200000;
      const radiusTop = 130;
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
        opacity: 0.6
      });

      const particles = new THREE.Points(geometry, material);
      particles.rotation.x = Math.PI / 2;
      particles.position.z = -2000;
      scene.add(particles);

      // Fonction d'animation des particules
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




      // Ajouter les pochettes d'albums
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
        mesh.position.set(0, 0, 720 - index * 20);
        scene.add(mesh);
        albumMeshes.push(mesh);

        const sound = new THREE.PositionalAudio(listener);
        const apiUrl = process.env.API_URL;
        const audioUrl = `${apiUrl}?url=${encodeURIComponent(track.preview)}`;

        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(audioUrl, (buffer) => {
          sound.setBuffer(buffer);
          sound.setRefDistance(1);
          sound.setLoop(true);
          sound.setVolume(1);
          sound.play();
        });
        sounds.push(sound);
        mesh.add(sound);

        // Ajouter le texte sous la pochette
        const textDiv = document.createElement("div");
        textDiv.className = "info";
        textDiv.textContent = `${track.title} - ${track.artist.name}`;
        infoContainer.appendChild(textDiv);
        mesh.userData.textDiv = textDiv;
      });

      // Variables pour le zoom fluide
    
      this.currentZ = this.camera.position.z;
      const zoomSmoothness = 0.1;

      // Animation du zoom
      window.addEventListener("wheel", (event) => {
        event.preventDefault();
        this.targetZ -= event.deltaY * 0.01;
      }, { passive: false });

      // Gérer le mouvement de la souris
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

        // Déplacer la sphère en fonction de la position de la souris
        if (this.model) {
          this.model.rotation.x -= mouse.x * 0.01; // Contrôle la vitesse de la rotation X
          this.lastRotationX = this.model.rotation.x;
          this.model.rotation.y -= mouse.y * 0.01; // Contrôle la vitesse de la rotation Y
          this.lastRotationY = this.model.rotation.y;
        }
        

        // Rotation légère de la sphère
        if (this.model) {
          this.model.rotation.x = this.lastRotationX; // Rotation lente sur l'axe X
          this.model.rotation.y = this.lastRotationY; // Rotation lente sur l'axe Y
        }
     

        if (!this.cameraAnimationInProgress) {
          // Assurez-vous que currentZ est bien synchronisé avec targetZ
          this.currentZ += (this.targetZ - this.currentZ) * zoomSmoothness;
          this.camera.position.z = this.currentZ;
        }

        albumMeshes.forEach((mesh, index) => {
          const distance = this.camera.position.distanceTo(mesh.position);
          const volume = Math.max(0, 1.5 - distance / 10);
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

        renderer.render(scene, this.camera);  // Fixe l'accès au renderer ici
      };

      animate();

      // Écouteur d'événement pour le redimensionnement de la fenêtre
      const onWindowResize = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', onWindowResize);

      // Sauvegarder les éléments pour nettoyage
      this.scene = scene;
      this.renderer = renderer;  // Lier le renderer à this
    },


    

    cleanUp() {
      this.renderer.dispose();
    },
  },
};
</script>

<style scoped>
/* Ajoutez votre CSS ici */
</style>
