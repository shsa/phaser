import Phaser from 'phaser';
import {
	IWorld,
	defineSystem,
	defineQuery,
	removeComponent,
} from 'bitecs';

import Options from '@/game/Options';
import Entity from '@/game/components/Entity';
import Position from '@/game/components/Position';
import Sprite, { SpriteType } from '@/game/components/Sprite';
import Input, { Direction } from '@/game/components/Input';
import { nextTween } from '@/game/helper';
import BoxPlace from '@/game/components/BoxPlace';
import Box from '@/game/components/Box';

export default function createEntityMovementSystem(tweens: Phaser.Tweens.TweenManager) {
	const entityQuery = defineQuery([Entity, Sprite, Input, Position]);
	const boxPlaceQuery = defineQuery([BoxPlace, Position]);

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
			target.x = Position.x[player];
			target.y = Position.y[player];
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

	function isBox(entity: number): boolean {
		switch (Sprite.type[entity]) {
			case SpriteType.BoxNormal:
			case SpriteType.BoxPlaced:
			case SpriteType.BoxMoney:
				return true;
			default:
				return false;
        }
    }

	function isBoxPlaced(world: IWorld, box: number) {
		const x = Math.round(Position.x[box]);
		const y = Math.round(Position.y[box]);
		const entities = boxPlaceQuery(world);
		for (let i = 0; i < entities.length; i++) {
			const place = entities[i];
			if (Position.x[place] == x && Position.y[place] == y) {
				return true;
            }
		}
		return false;
    }

	return defineSystem((world) => {
		const entities = entityQuery(world);

		for (let i = 0; i < entities.length; ++i)
		{
			const id = entities[i];

			if (isBox(id)) {
				if (isBoxPlaced(world, id)) {
					if (Box.money[id] == 1) {
						Sprite.type[id] = SpriteType.BoxMoney;
					} else {
						Sprite.type[id] = SpriteType.BoxPlaced;
					}
				} else {
					Sprite.type[id] = SpriteType.BoxNormal;
                }
            }

			if (tween?.isPlaying() ?? false) {
				Position.x[id] = target.x;
				Position.y[id] = target.y;
			}
			else {
				Position.x[id] = Math.round(Position.x[id]);
				Position.y[id] = Math.round(Position.y[id]);

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