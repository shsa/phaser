"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Phaser = require("phaser");
var Example_1 = require("./scenes/Game");
var gameConfig = {
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
    scene: [Example_1.default]
};
var game = new Phaser.Game(gameConfig);
exports.default = game;
//# sourceMappingURL=Init.js.map