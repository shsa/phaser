import Phaser from 'phaser';
import {
	defineSystem,
	defineQuery,
	enterQuery,
	exitQuery
} from 'bitecs';

import GameScene from '@/game/scenes/GameScene';
import Player, { PlayerStatus } from '@/game/components/Player';
import Position from '@/game/components/Position';
import Options from '@/game/Options';

export default function createPlayerViewSystem(scene: GameScene) {
	const spritesById = new Map<number, Phaser.GameObjects.Sprite>();

	const playerQuery = defineQuery([Player, Position]);
	
	const playerQueryEnter = enterQuery(playerQuery);
	const playerQueryExit = exitQuery(playerQuery);

	function play(sprite: Phaser.GameObjects.Sprite, name: string, duration: number = 0) {
		if (name == "rest" && sprite.anims.getName() == "smoke") {
			return;
        }

		if (sprite.anims.getName() !== name || !sprite.anims.isPlaying) {
			sprite.anims.play(name);
			if (duration > 0) {
				let _duration = 0;
				sprite.anims.currentAnim.frames.forEach(function (frame) {
					_duration += frame.duration;
				});
				sprite.anims.timeScale = (_duration / duration) * sprite.anims.animationManager.globalTimeScale;
			}
			else {
				sprite.anims.timeScale = 1;
            }
			return;
		}
	}

	return defineSystem((world) => {
		const entitiesEntered = playerQueryEnter(world);

		for (let i = 0; i < entitiesEntered.length; ++i) {
			const id = entitiesEntered[i];
			const sprite = scene.add.sprite(0, 0, 'player');
			sprite.setDepth(10);
			spritesById.set(id, sprite);
			play(sprite, "idle");
			sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, function (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame, gameObject: Phaser.GameObjects.Sprite) {
				if (anim.key == "rest") {
					play(gameObject, "smoke");
				}
			});
		}

		const entities = playerQuery(world);
		for (let i = 0; i < entities.length; ++i) {
			const id = entities[i];

			scene.position_x.setText("x: " + Position.x[id].toFixed(1));
			scene.position_y.setText("y: " + Position.y[id].toFixed(1));

			const sprite = spritesById.get(id);
			if (!sprite) {
				// log an error
				continue;
			}

			const status = Player.status[id];
			const duration = Player.duration[id];
			switch (status) {
				case PlayerStatus.None:
					//sprite.anims.stop();
					break;
				case PlayerStatus.Idle:
					play(sprite, "idle");
					break;
				case PlayerStatus.Hidden:
					play(sprite, "hidden");
					break;
				case PlayerStatus.Rest:
					play(sprite, "rest");
					break;
				case PlayerStatus.Walk_L:
					play(sprite, "walk-l", duration);
					break;
				case PlayerStatus.Walk_R:
					play(sprite, "walk-r", duration);
					break;
				case PlayerStatus.Walk_U:
					play(sprite, "walk-u", duration);
					break;
				case PlayerStatus.Walk_D:
					play(sprite, "walk-d", duration);
					break;

				case PlayerStatus.Push_L:
					play(sprite, "push-l", duration);
					break;
				case PlayerStatus.Push_R:
					play(sprite, "push-r", duration);
					break;
				case PlayerStatus.Push_U:
					play(sprite, "push-u", duration);
					break;
				case PlayerStatus.Push_D:
					play(sprite, "push-d", duration);
					break;

				case PlayerStatus.Walk_U_Stairs_Start0:
					play(sprite, "walk_u_stairs_start0", duration);
					break;
				case PlayerStatus.Walk_U_Stairs_Start1:
					play(sprite, "walk_u_stairs_start1", duration);
					break;
				case PlayerStatus.Walk_D_Stairs_Start0:
					play(sprite, "walk_d_stairs_start0", duration);
					break;
				case PlayerStatus.Walk_D_Stairs_Start1:
					play(sprite, "walk_d_stairs_start1", duration);
					break;
				case PlayerStatus.Walk_U_Stairs:
					play(sprite, "walk_u_stairs", duration);
					break;
				case PlayerStatus.Walk_D_Stairs:
					play(sprite, "walk_d_stairs", duration);
					break;
				case PlayerStatus.Walk_U_Stairs_End0:
					play(sprite, "walk_u_stairs_end0", duration);
					break;
				case PlayerStatus.Walk_U_Stairs_End1:
					play(sprite, "walk_u_stairs_end1", duration);
					break;
				case PlayerStatus.Walk_D_Stairs_End0:
					play(sprite, "walk_d_stairs_end0", duration);
					break;
				case PlayerStatus.Walk_D_Stairs_End1:
					play(sprite, "walk_d_stairs_end1", duration);
					break;
				case PlayerStatus.Walk_D_Stairs_End2:
					play(sprite, "walk_d_stairs_end2", duration);
					break;

				case PlayerStatus.Applause:
					play(sprite, "applause");
					break;
				case PlayerStatus.Smile:
					play(sprite, "smile");
					break;
				case PlayerStatus.WithMoney:
					play(sprite, "with_money");
					break;
				case PlayerStatus.Feeding:
					play(sprite, "feeding");
					break;
				case PlayerStatus.WellFed:
					play(sprite, "well-fed");
					break;
				case PlayerStatus.Fear:
					play(sprite, "fear");
					break;
			}

			sprite.x = Options.game_offset_x + Position.x[id] * Options.tile_width;
			sprite.y = Options.game_offset_y + Position.y[id] * Options.tile_height;
		}

		const entitiesExited = playerQueryExit(world);
		for (let i = 0; i < entitiesExited.length; ++i) {
			const id = entitiesEntered[i];
			spritesById.delete(id);
		}

		return world;
	});
}
