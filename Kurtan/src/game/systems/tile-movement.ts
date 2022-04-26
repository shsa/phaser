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
import { LevelMap } from '@/game/helper';

export default function createTileMovementSystem(tweens: Phaser.Tweens.TweenManager) {
	const tileQuery = defineQuery([Tile, Input, GridPosition]);

	const target = {
		x: 0,
		y: 0,
		next_x: 0,
		next_y: 0,
		dt: 0, // time after last action
	};

	let tween = tweens.add({
		targets: [],
		paused: true
	});

	function updateTween(player: number, dir: Direction) {
		tween.stop();
		tween.remove();

		target.x = GridPosition.x[player];
		target.y = GridPosition.y[player];
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

		tween = tweens.add({
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

			if (tween.isPlaying()) {
				GridPosition.x[id] = target.x;
				GridPosition.y[id] = target.y;
				target.dt = 0;
			}
			else {
				GridPosition.x[id] = Math.round(GridPosition.x[id]);
				GridPosition.y[id] = Math.round(GridPosition.y[id]);

				if (Input.direction[id] == Direction.None) {
					removeComponent(world, Input, id);
				}
				else {
					updateTween(id, Input.direction[id]);
					Input.direction[id] = Direction.None;
                }
            }
		}
	
		return world;
	})
}