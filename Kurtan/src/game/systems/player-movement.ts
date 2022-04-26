import Phaser from 'phaser';
import {
	defineSystem,
	defineQuery,
	enterQuery,
	IWorld,
	hasComponent,
	addComponent
} from 'bitecs';

import Options from '@/game/Options';
import Player, { PlayerStatus } from '@/game/components/Player';
import Tile from '@/game/components/Tile';
import Sprite, { SpriteType } from '@/game/components/Sprite';
import GridPosition from '@/game/components/GridPosition';
import Input, { Direction } from '@/game/components/Input';
import { LevelMap } from '@/game/helper';

export default function createPlayerMovementSystem(tweens: Phaser.Tweens.TweenManager) {
	const playerQuery = defineQuery([Player, GridPosition, Input]);
	const tileQuery = defineQuery([Tile, Sprite, GridPosition]);

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

	const map = new LevelMap();

	function updateTween(player: number, action: PlayerStatus) {
		tween.stop();
		tween.remove();

		target.x = GridPosition.x[player];
		target.y = GridPosition.y[player];
		target.next_x = target.x;
		target.next_y = target.y;
		switch (action) {
			case PlayerStatus.Walk_L:
				target.next_x -= 1;
				break;
			case PlayerStatus.Walk_R:
				target.next_x += 1;
				break;
			case PlayerStatus.Walk_U:
				target.next_y -= 1;
				break;
			case PlayerStatus.Walk_D:
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

	function getMapTile(player: number, action: PlayerStatus, offset: number): SpriteType {
		const x = GridPosition.x[player];
		const y = GridPosition.y[player];

		switch (action) {
			case PlayerStatus.Walk_L:
				return map.get(x - offset, y);
			case PlayerStatus.Walk_R:
				return map.get(x + offset, y);
			case PlayerStatus.Walk_U:
				return map.get(x, y - offset);
			case PlayerStatus.Walk_D:
				return map.get(x, y + offset);
			default:
				return SpriteType.None;
        }
    }

	function getMapTag(player: number, action: PlayerStatus, offset: number): number {
		const x = GridPosition.x[player];
		const y = GridPosition.y[player];

		switch (action) {
			case PlayerStatus.Walk_L:
				return map.getTag(x - offset, y);
			case PlayerStatus.Walk_R:
				return map.getTag(x + offset, y);
			case PlayerStatus.Walk_U:
				return map.getTag(x, y - offset);
			case PlayerStatus.Walk_D:
				return map.getTag(x, y + offset);
			default:
				return 0;
		}
	}

	function setPushStatus(player: number, action: PlayerStatus) {
		switch (action) {
			case PlayerStatus.Walk_L:
				Player.status[player] = PlayerStatus.Push_L;
				break;
			case PlayerStatus.Walk_R:
				Player.status[player] = PlayerStatus.Push_R;
				break;
			case PlayerStatus.Walk_U:
				Player.status[player] = PlayerStatus.Push_U;
				break;
			case PlayerStatus.Walk_D:
				Player.status[player] = PlayerStatus.Push_D;
				break;
			default:
				Player.status[player] = action;
		}
    }

	function moveTo(world: IWorld, player: number, action: PlayerStatus) {
		if (tween.isPlaying()) {
			return;
		}

		const next1 = getMapTile(player, action, 1);
		if (next1 == SpriteType.Wall) {
			updateTween(player, PlayerStatus.None);
			setPushStatus(player, action);
		}
		else if (next1 == SpriteType.Box) {
			if (getMapTile(player, action, 2) == SpriteType.Space) {
				updateTween(player, action);
				setPushStatus(player, action);
				const tile = getMapTag(player, action, 1);
				if (!hasComponent(world, Input, tile)) {
					addComponent(world, Input, tile);
                }
				Input.direction[tile] = Input.direction[player];
			}
			else {
				updateTween(player, PlayerStatus.None);
				setPushStatus(player, action);
			}
		}
		else {
			updateTween(player, action);
			Player.status[player] = action;
        }
	}

	function fillMap(world: IWorld) {
		map.clear();
		const tiles = tileQuery(world);
		for (let i = 0; i < tiles.length; i++) {
			const tile = tiles[i];
			const col = Math.round(GridPosition.x[tile]);
			const row = Math.round(GridPosition.y[tile]);
			switch (Sprite.type[tile]) {
				case SpriteType.Wall:
				case SpriteType.Stone:
					map.set(col, row, SpriteType.Wall);
					break;
				case SpriteType.Box:
				case SpriteType.BoxPlaced:
					map.set(col, row, SpriteType.Box);
					map.setTag(col, row, tile);
            }
		}
    }

	return defineSystem((world) => {
		fillMap(world);
		const entities = playerQuery(world);

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

				target.dt += Options.time_delta;

				switch (Input.direction[id]) {
					case Direction.Left:
						moveTo(world, id, PlayerStatus.Walk_L);
						break;
					case Direction.Right:
						moveTo(world, id, PlayerStatus.Walk_R);
						break;
					case Direction.Up:
						moveTo(world, id, PlayerStatus.Walk_U);
						break;
					case Direction.Down:
						moveTo(world, id, PlayerStatus.Walk_D);
						break;
					default:
						if (target.dt > Options.rest_timeout) {
							Player.status[id] = PlayerStatus.Rest;
						}
						else if (target.dt > Options.idle_timeout) {
							Player.status[id] = PlayerStatus.Idle;
						}
						else {
							Player.status[id] = PlayerStatus.None;
						}
				}
				Input.direction[id] = Direction.None;
            }
		}
	
		return world;
	})
}