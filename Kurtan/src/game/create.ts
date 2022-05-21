import * as Phaser from "phaser";
import { Plugin as NineSlicePlugin } from 'phaser3-nineslice';
import GameScene from "@/game/scenes/GameScene";

const gameConfig: Phaser.Types.Core.GameConfig = {
    title: "Kurtan",

    type: Phaser.AUTO,
    pixelArt: false,

    banner: false,

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

    plugins: {
        global: [NineSlicePlugin.DefaultCfg],
    },

    scene: [GameScene]
};

export default function createGame() {
    new Phaser.Game(gameConfig);
}