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
import Level, { LevelStatus } from '@/game/components/Level';

import createLevelLoaderSystem from '@/game/systems/level-loader';
import createPlayerControllerSystem from '@/game/systems/player-controller';
import createPlayerMovementSystem from '@/game/systems/player-movement';
import createEntityMovementSystem from '@/game/systems/entity-movement'
import createMovementSystem from '@/game/systems/movement';

import createTileViewSystem from '@/game/systems/view/tile_view';
import createEntityViewSystem from '@/game/systems/view/entity_view';
import createPlayerViewSystem from '@/game/systems/view/player_view';
import createCameraSystem from '@/game/systems/camera';

export default class Game extends Phaser.Scene {

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private world!: IWorld;
    private levelLoaderSystem!: System;
    private playerControllerSystem!: System;
    private playerMovementSystem!: System;
    private entityMovementSystem!: System;
    private movementSystem!: System;

    private tileViewSystem!: System;
    private entityViewSystem!: System;
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

        this.load.spritesheet("player", "/assets/player.png", { frameWidth: Options.tile_width, frameHeight: Options.tile_height, spacing: 1 });
        this.load.animation("playerAnimations", "/assets/player.json");

        this.load.spritesheet("box", "/assets/box.png", { frameWidth: Options.tile_width, frameHeight: Options.tile_height, spacing: 1 });
        this.load.animation("boxAnimations", "/assets/box.json");
    }
    
    create() {
        const { width, height } = this.scale;
        this.world = createWorld();

        // create the player tank
        const player_id = addEntity(this.world)

        addComponent(this.world, Player, player_id)
        addComponent(this.world, GridPosition, player_id)
        addComponent(this.world, Input, player_id)

        Player.status[player_id] = PlayerStatus.Start;

        const level = addEntity(this.world);
        addComponent(this.world, Level, level);
        Level.index[level] = 18;
        Level.status[level] = LevelStatus.Load;

        // create the systems
        this.levelLoaderSystem = createLevelLoaderSystem();
        this.playerControllerSystem = createPlayerControllerSystem(this.cursors);
        this.playerMovementSystem = createPlayerMovementSystem(this.tweens);
        this.entityMovementSystem = createEntityMovementSystem(this.tweens);
        this.movementSystem = createMovementSystem();

        this.tileViewSystem = createTileViewSystem(this);
        this.entityViewSystem = createEntityViewSystem(this);
        this.playerViewSystem = createPlayerViewSystem(this);
        //this.cameraSystem = createCameraSystem(this.cameras.main);
    }

    update(t: number, dt: number) {
        Options.time = t;
        Options.time_delta = dt;

        this.levelLoaderSystem(this.world);

        // run each system in desired order
        this.playerControllerSystem(this.world);

        //this.movementSystem(this.world);
        this.entityMovementSystem(this.world);
        this.playerMovementSystem(this.world);

        this.tileViewSystem(this.world);
        this.playerViewSystem(this.world);
        this.entityViewSystem(this.world);
        //this.cameraSystem(this.world);
    }
}