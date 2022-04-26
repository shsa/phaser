//import { defineCustomElements as defineIonPhaser } from "@ion-phaser/core/loader";
import { createApp } from 'vue'
import App from './App.vue'

import createGame from "@/game/create";

createGame();

createApp(App).mount('#app')
