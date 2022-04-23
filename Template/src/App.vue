<template>
    <div id="game" />
</template>

<script lang="ts">


import { defineComponent } from 'vue';
//import HelloWorld from "./components/HelloWorld.vue";
    import game from "./game/Init";


export default defineComponent({
    name: 'App',
    game: game,
  components: {
  }
});
</script>