import * as Phaser from "phaser";
import Example from "@/game/scenes/Example";

const gameConfig: Phaser.Types.Core.GameConfig = {
    title: "Sample",

    type: Phaser.AUTO,

    scale: {
        //    width: window.innerWidth,
        //    height: window.innerHeight
        width: 640,
        height: 480
    },

    physics: {
        default: "arcade",
        arcade: {
            debug: true
        }
    },

    parent: "game",
    backgroundColor: "#8080F0",

    scene: [Example]
};

const game = new Phaser.Game(gameConfig);
export default game;