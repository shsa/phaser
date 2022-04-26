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

import Options from '@/game/Options';

import Player, { PlayerStatus } from '@/game/components/Player';
import Input from '@/game/components/Input';
import GridPosition from '@/game/components/GridPosition';
import Sprite from '@/game/components/Sprite';
import Level from '@/game/components/Level';

import createLevelSystem from '@/game/systems/level';
import createPlayerSystem from '@/game/systems/player';
import createPlayerMovementSystem from '@/game/systems/player-movement';
import createTileMovementSystem from '@/game/systems/tile-movement'
import createMovementSystem from '@/game/systems/movement';

import createTileViewSystem from '@/game/systems/view/tile_view';
import createPlayerViewSystem from '@/game/systems/view/player_view';
import createCameraSystem from '@/game/systems/camera';

export default class Game extends Phaser.Scene {

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private world!: IWorld;
    private levelSystem!: System;
    private playerSystem!: System;
    private playerMovementSystem!: System;
    private tileMovementSystem!: System;
    private movementSystem!: System;
    private spriteSystem!: System;
    private playerViewSystem!: System;
    private cameraSystem!: System;

    constructor() {
        super("game");
    }

    init() {
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    preload() {
        this.load.image('wall', '/assets/wall.png');
        this.load.image('space', '/assets/space.png');
        this.load.image('stone', '/assets/stone.png');
        this.load.image('place', '/assets/place.png');
        this.load.image('box', '/assets/box.png');
        this.load.image('box_placed', '/assets/box_placed.png');

        this.load.spritesheet("player", "/assets/player.png", { frameWidth: Options.tile_width, frameHeight: Options.tile_height, spacing: 1 });
        this.load.animation("playerAnimations", "/assets/player.json");
    }
    
    create() {
        const { width, height } = this.scale;
        this.world = createWorld();

        // create the player tank
        const player_id = addEntity(this.world)

        addComponent(this.world, Player, player_id)
        addComponent(this.world, GridPosition, player_id)
        addComponent(this.world, Input, player_id)

        Player.status[player_id] = PlayerStatus.Idle;
        GridPosition.x[player_id] = 10;
        GridPosition.y[player_id] = 10;

        const level = addEntity(this.world);
        addComponent(this.world, Level, level);
        Level.index[level] = 17;

        // create the systems
        this.levelSystem = createLevelSystem();
        this.playerSystem = createPlayerSystem(this.cursors);
        this.playerMovementSystem = createPlayerMovementSystem(this.tweens);
        this.tileMovementSystem = createTileMovementSystem(this.tweens);
        this.movementSystem = createMovementSystem();
        this.spriteSystem = createTileViewSystem(this);
        this.playerViewSystem = createPlayerViewSystem(this);
        //this.cameraSystem = createCameraSystem(this.cameras.main);
    }

    update(t: number, dt: number) {
        Options.time = t;
        Options.time_delta = dt;

        this.levelSystem(this.world);

        // run each system in desired order
        this.playerSystem(this.world);

        //this.movementSystem(this.world);
        this.tileMovementSystem(this.world);
        this.playerMovementSystem(this.world);

        this.playerViewSystem(this.world);
        this.spriteSystem(this.world);
        //this.cameraSystem(this.world);
    }
}