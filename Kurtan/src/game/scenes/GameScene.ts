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

import Game from '@/game/components/Game'
import Player, { PlayerStatus } from '@/game/components/Player';
import Input from '@/game/components/Input';
import Position from '@/game/components/Position';
import Sprite from '@/game/components/Sprite';
import Level from '@/game/components/Level';
import Message from '@/game/components/Message';

import createLevelLoaderSystem from '@/game/systems/level-loader';
import createPlayerControllerSystem from '@/game/systems/player-controller';
import createPlayerMovementSystem from '@/game/systems/player-movement';
import createEntityMovementSystem from '@/game/systems/entity-movement'
import createDemoSystem from '@/game/systems/demo';


import createTileViewSystem from '@/game/systems/view/tile_view';
import createEntityViewSystem from '@/game/systems/view/entity_view';
import createPlayerViewSystem from '@/game/systems/view/player_view';

import createCleanupSystem from '@/game/systems/cleanup';
import createMessageViewSystem from "@/game/systems/view/message_view";
import createAppleSystem from "../systems/apple_system";

export default class GameScene extends Phaser.Scene {

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private world!: IWorld;
    private levelLoaderSystem!: System;
    private playerControllerSystem!: System;
    private playerMovementSystem!: System;
    private entityMovementSystem!: System;
    private demoSystem!: System;
    private appleSystem!: System;


    private messageViewSystem!: System;
    private tileViewSystem!: System;
    private entityViewSystem!: System;
    private playerViewSystem!: System;

    private cleanupSystem!: System;

    public position_x!: Phaser.GameObjects.Text;
    public position_y!: Phaser.GameObjects.Text;

    public message_text!: Phaser.GameObjects.Text;
    public message_frame!: Phaser.GameObjects.RenderTexture;

    constructor() {
        super("game");
    }

    init() {
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    preload() {
        this.load.image('wall', 'assets/wall.png');
        this.load.image('space', 'assets/space.png');
        this.load.image('stone', 'assets/stone.png');
        this.load.image('place', 'assets/place.png');
        this.load.image('secret', 'assets/secret.png');
        this.load.image('stairs', 'assets/stairs.png');
        this.load.image('error', 'assets/error.png');

        this.load.spritesheet("player", "assets/player.png", { frameWidth: Options.tile_width, frameHeight: Options.tile_height, spacing: 1 });
        this.load.animation("playerAnimations", "assets/player.json");

        this.load.spritesheet("box", "assets/box.png", { frameWidth: Options.tile_width, frameHeight: Options.tile_height, spacing: 1 });
        this.load.animation("boxAnimations", "assets/box.json");

        this.load.spritesheet("apple", "assets/apple.png", { frameWidth: Options.tile_width, frameHeight: Options.tile_height, spacing: 1 });
        this.load.animation("appleAnimations", "assets/apple.json");

        this.load.spritesheet("door", "assets/door.png", { frameWidth: Options.tile_width, frameHeight: Options.tile_height, spacing: 1 });
        this.game.events.on(Phaser.Core.Events.BLUR, this.onBlur, this);
        this.game.events.on(Phaser.Core.Events.FOCUS, this.onFocus, this);

        this.position_x = this.add.text(10, 322, "test");
        this.position_x.depth = 110;

        this.position_y = this.add.text(100, 322, "test");
        this.position_y.depth = 110;

        this.load.image("message", "assets/message.png");
    }

    onBlur() {
        //    Object.keys(this.cursors).forEach(key => {
        //        const value = Reflect.get(this.cursors, key);
        //        if (value instanceof Phaser.Input.Keyboard.Key) {
        //            value.isDown = false;
        //        }
        //    });
    }

    onFocus() {

    }

    showMessage(text: string) {
        if (this.message_frame == undefined) {
            this.message_text = this.add.text(320, 170, "");
            this.message_text.setDepth(2000);
            this.message_text.setOrigin(0.5);
            this.message_text.setColor("#55FEFE");
            this.message_text.setShadow(2, 2, "#0000A9");

            this.message_frame = this.add.nineslice(
                0, 0,   // this is the starting x/y location
                16, 16,   // the width and height of your object
                'message', // a key to an already loaded image
                4,         // the width and height to offset for a corner slice
                4          // (optional) pixels to offset when computing the safe usage area
            );
            this.message_frame.setDepth(1000);
            this.message_frame.setOrigin(0.5);
            this.message_frame.setPosition(320, 170);
        }
        this.message_text.setText(text);
        const r = this.message_text.getBounds();
        this.message_frame.resize(r.width + 20, r.height + 14);

        this.message_text.visible = true;
        this.message_frame.visible = true;
    }

    hideMessage() {
        if (this.message_frame != undefined) {
            this.message_text.visible = false;
            this.message_frame.visible = false;
        }
    }

    create() {
        //this.showMessage("Ваш приз пропал навсегда!");

        const { width, height } = this.scale;
        this.world = createWorld();

        // create the player tank
        const player_id = addEntity(this.world)

        addComponent(this.world, Player, player_id);
        addComponent(this.world, Level, player_id);
        addComponent(this.world, Position, player_id);
        addComponent(this.world, Input, player_id);
        addComponent(this.world, Message, player_id);

        Player.status[player_id] = PlayerStatus.Start;

        const game = addEntity(this.world);
        addComponent(this.world, Game, game);
        addComponent(this.world, Level, game);
        Level.index[game] = 18;

        // create the systems
        this.levelLoaderSystem = createLevelLoaderSystem();
        this.playerControllerSystem = createPlayerControllerSystem(this.cursors);
        this.playerMovementSystem = createPlayerMovementSystem(this.tweens);
        this.entityMovementSystem = createEntityMovementSystem(this.tweens);
        this.demoSystem = createDemoSystem(this.tweens, this.anims);
        this.appleSystem = createAppleSystem(this.tweens);

        this.tileViewSystem = createTileViewSystem(this);
        this.entityViewSystem = createEntityViewSystem(this);
        this.playerViewSystem = createPlayerViewSystem(this);
        this.messageViewSystem = createMessageViewSystem(this);

        this.cleanupSystem = createCleanupSystem();
        //    this.tweens.timeScale = 0.2;
        //    this.anims.globalTimeScale = 0.2
    }

    update(t: number, dt: number) {
        Options.time = t;
        Options.time_delta = dt;

        this.demoSystem(this.world);

        this.levelLoaderSystem(this.world);

        this.appleSystem(this.world);
        this.playerControllerSystem(this.world);

        this.entityMovementSystem(this.world);
        this.playerMovementSystem(this.world);


        this.messageViewSystem(this.world);
        this.tileViewSystem(this.world);
        this.playerViewSystem(this.world);
        this.entityViewSystem(this.world);

        this.cleanupSystem(this.world);
    }
}