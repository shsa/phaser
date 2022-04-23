import * as Phaser from "phaser";

export default class Scene2 extends Phaser.Scene {
    constructor(config: Phaser.Types.Core.GameConfig) {
        super(config);
    }

    preload() {
        this.load.spritesheet('diamonds', 'https://labs.phaser.io/assets/sprites/diamonds32x24x5.png', { frameWidth: 32, frameHeight: 24 });
    }

    create() {

        this.add.text(400, 32, 'Click to create animations', { color: '#00ff00' })
            .setOrigin(0.5, 0);
    //    const group = this.add.group({
    //        key: 'diamonds',
    //        frame: [0, 1, 2, 3, 4],
    //        frameQuantity: 20
    //    });

    //    Phaser.Actions.GridAlign(group.getChildren(), {
    //        width: 10,
    //        height: 10,
    //        cellWidth: 32,
    //        cellHeight: 32,
    //        x: 100,
    //        y: 100
    //    });
    }
}