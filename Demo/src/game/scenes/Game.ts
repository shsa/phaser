import * as Phaser from "phaser";

import {
    createWorld,
    addEntity,
    addComponent,
} from 'bitecs';

import type {
    IWorld,
    System
} from 'bitecs';


import Player from '@/game/components/Player';
import Input from '@/game/components/Input';
import Position from '@/game/components/Position';
import Velocity from '@/game/components/Velocity';
import Sprite from '@/game/components/Sprite';
import Rotation from '@/game/components/Rotation';

import createPlayerSystem from '@/game/systems/player';
import createMovementSystem from '@/game/systems/movement';
import createSpriteSystem from '@/game/systems/sprite';
import createCameraSystem from '@/game/systems/camera';

export default class Game extends Phaser.Scene {

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private world!: IWorld;
    private playerSystem!: System;
    private movementSystem!: System;
    private spriteSystem!: System;
    private cameraSystem!: System;

    constructor() {
        super("game");
    }

    init() {
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    preload() {
        this.load.image('tank-blue', '/assets/tank_blue.png');
        this.load.image('tank-green', '/assets/tank_green.png');
        this.load.image('tank-red', '/assets/tank_red.png');
    }
    
    create() {
        const { width, height } = this.scale;
        this.world = createWorld();

        // create the player tank
        const blueTank = addEntity(this.world)

        addComponent(this.world, Player, blueTank)
        addComponent(this.world, Position, blueTank)
        addComponent(this.world, Velocity, blueTank)
        addComponent(this.world, Rotation, blueTank)
        addComponent(this.world, Sprite, blueTank)
        addComponent(this.world, Input, blueTank)

        for (let i = 0; i < 10; i++) {
            const entity = addEntity(this.world);
            addComponent(this.world, Position, entity);
            Position.x[entity] = Phaser.Math.Between(0, width);
            Position.y[entity] = Phaser.Math.Between(0, height);

            addComponent(this.world, Rotation, entity);

            addComponent(this.world, Sprite, entity);
            Sprite.texture[entity] = Phaser.Math.Between(1, 2);
        }


        // create the systems
        this.playerSystem = createPlayerSystem(this.cursors);
        this.movementSystem = createMovementSystem();
        this.spriteSystem = createSpriteSystem(this, ['tank-blue', 'tank-green', 'tank-red']);
        this.cameraSystem = createCameraSystem(this.cameras.main);
    }

    update(t: number, dt: number) {
        // run each system in desired order
        this.playerSystem(this.world);

        this.movementSystem(this.world);

        this.spriteSystem(this.world);
        this.cameraSystem(this.world);
    }
}