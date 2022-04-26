import * as Phaser from "phaser";
import Game from "@/game/scenes/Game";

const gameConfig: Phaser.Types.Core.GameConfig = {
    title: "Sample",

    type: Phaser.AUTO,

    scale: {
        //    width: window.innerWidth,
        //    height: window.innerHeight
        //parent: 'phaser-example',

        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,

        width: 640,
        height: 340
    },

    physics: {
        default: "arcade",
        arcade: {
            debug: true
        }
    },

    parent: "game",
    backgroundColor: "#8080F0",

    scene: [Game]
};

export default function createGame() {
    new Phaser.Game(gameConfig);
}