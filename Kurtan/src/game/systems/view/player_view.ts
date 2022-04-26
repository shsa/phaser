import Phaser from 'phaser';
import {
	defineSystem,
	defineQuery,
	enterQuery,
	exitQuery
} from 'bitecs';

import Player, { PlayerStatus } from '@/game/components/Player';
import GridPosition from '@/game/components/GridPosition';
import Options from '@/game/Options';

export default function createPlayerViewSystem(scene: Phaser.Scene) {
	const spritesById = new Map<number, Phaser.GameObjects.Sprite>();

	const playerQuery = defineQuery([Player, GridPosition]);
	
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
				sprite.anims.timeScale = _duration / duration;
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

			const sprite = spritesById.get(id);
			if (!sprite) {
				// log an error
				continue;
			}

			const status = Player.status[id];
			switch (status) {
				case PlayerStatus.None:
					//sprite.anims.stop();
					break;
				case PlayerStatus.Idle:
					play(sprite, "idle");
					break;
				case PlayerStatus.Rest:
					play(sprite, "rest");
					break;
				case PlayerStatus.Walk_L:
					play(sprite, "walk-l", Options.walk_duration);
					break;
				case PlayerStatus.Walk_R:
					play(sprite, "walk-r", Options.walk_duration);
					break;
				case PlayerStatus.Walk_U:
					play(sprite, "walk-u", Options.walk_duration);
					break;
				case PlayerStatus.Walk_D:
					play(sprite, "walk-d", Options.walk_duration);
					break;

				case PlayerStatus.Push_L:
					play(sprite, "push-l", Options.walk_duration);
					break;
				case PlayerStatus.Push_R:
					play(sprite, "push-r", Options.walk_duration);
					break;
				case PlayerStatus.Push_U:
					play(sprite, "push-u", Options.walk_duration);
					break;
				case PlayerStatus.Push_D:
					play(sprite, "push-d", Options.walk_duration);
					break;
			}

			sprite.x = GridPosition.x[id] * Options.tile_width;
			sprite.y = GridPosition.y[id] * Options.tile_height;
		}

		const entitiesExited = playerQueryExit(world);
		for (let i = 0; i < entitiesExited.length; ++i) {
			const id = entitiesEntered[i];
			spritesById.delete(id);
		}

		return world;
	});
}
