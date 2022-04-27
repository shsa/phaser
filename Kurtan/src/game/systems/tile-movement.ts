import Phaser from 'phaser';
import {
	defineSystem,
	defineQuery,
	enterQuery,
	removeComponent,
    IWorld,
} from 'bitecs';

import Options from '@/game/Options';
import Player, { PlayerStatus } from '@/game/components/Player';
import Tile from '@/game/components/Tile';
import Sprite, { SpriteType } from '@/game/components/Sprite';
import GridPosition from '@/game/components/GridPosition';
import Input, { Direction } from '@/game/components/Input';
import { LevelMap, nextTween } from '@/game/helper';

export default function createTileMovementSystem(tweens: Phaser.Tweens.TweenManager) {
	const tileQuery = defineQuery([Tile, Input, GridPosition]);

	const target = {
		x: 0,
		y: 0,
		next_x: 0,
		next_y: 0,
		dt: 0, // time after last action
	};

	let tween: Phaser.Tweens.Tween | null = null;

	function makeTween(player: number, dir: Direction) {
		if (tween == null) {
			target.x = GridPosition.x[player];
			target.y = GridPosition.y[player];
		}

		target.next_x = target.x;
		target.next_y = target.y;
		switch (dir) {
			case Direction.Left:
				target.next_x -= 1;
				break;
			case Direction.Right:
				target.next_x += 1;
				break;
			case Direction.Up:
				target.next_y -= 1;
				break;
			case Direction.Down:
				target.next_y += 1;
				break;
		}

		tween = nextTween(tweens, tween, {
			targets: target,
			duration: Options.walk_duration,
			x: target.next_x,
			y: target.next_y,
			delay: 0,
			repeat: 0,
			yoyo: false
		});
    }

	return defineSystem((world) => {
		const entities = tileQuery(world);

		for (let i = 0; i < entities.length; ++i)
		{
			const id = entities[i];

			if (tween?.isPlaying() ?? false) {
				GridPosition.x[id] = target.x;
				GridPosition.y[id] = target.y;
			}
			else {
				GridPosition.x[id] = Math.round(GridPosition.x[id]);
				GridPosition.y[id] = Math.round(GridPosition.y[id]);

				if (Input.direction[id] == Direction.None) {
					if (tween) {
						tween.remove();
						tween = null;
					}
					removeComponent(world, Input, id);
				}
				else {
					makeTween(id, Input.direction[id]);
					Input.direction[id] = Direction.None;
                }
            }
		}
	
		return world;
	})
}