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
import Levels from '@/game/data/Levels';
import Level, { LevelStatus } from '@/game/components/Level';
import Player, { PlayerStatus } from '@/game/components/Player';
import Touchable from '@/game/components/Touchable';
import Sprite, { SpriteType } from '@/game/components/Sprite';
import GridPosition from '@/game/components/GridPosition';
import Input, { Direction } from '@/game/components/Input';
import { getMap, LevelMap, nextTween } from '@/game/helper';

export default function createPlayerMovementSystem(tweens: Phaser.Tweens.TweenManager) {
	const playerQuery = defineQuery([Player, GridPosition, Input]);
	const touchableQuery = defineQuery([Touchable, GridPosition]);
	const levelQuery = defineQuery([Level]);

	const target = {
		x: 0,
		y: 0,
		start_x: 0,
		start_y: 0,
		end_x: 0,
		end_y: 0,
		action: PlayerStatus.None,
		dt: 0, // time after last action
	};

	let tween: Phaser.Tweens.Tween | null = null;

	const map = new LevelMap();

	function updateTween(player: number, action: PlayerStatus) {
		tween?.remove();
		//console.log(tween.totalElapsed, Options.walk_duration, target.x, target.next_x);

		if (tween == null) {
			target.x = GridPosition.x[player];
			target.y = GridPosition.y[player];
		}

		target.end_x = Math.round(target.x);
		target.end_y = Math.round(target.y);
		switch (action) {
			case PlayerStatus.Walk_L:
				target.end_x -= 1;
				break;
			case PlayerStatus.Walk_R:
				target.end_x += 1;
				break;
			case PlayerStatus.Walk_U:
				target.end_y -= 1;
				break;
			case PlayerStatus.Walk_D:
				target.end_y += 1;
				break;
		}
		tween = nextTween(tweens, tween, {
			targets: target,
			duration: Options.walk_duration,
			x: target.end_x,
			y: target.end_y,
			ease: Phaser.Math.Easing.Linear,
			delay: 0,
			repeat: 0,
			yoyo: false
		});
    }

	function getMapTile(player: number, action: PlayerStatus, offset: number): SpriteType {
		const x = Math.round(GridPosition.x[player]);
		const y = Math.round(GridPosition.y[player]);

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
		const x = Math.round(GridPosition.x[player]);
		const y = Math.round(GridPosition.y[player]);

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

	function nextMapIndex(level: any, action: PlayerStatus): number {
		switch (action) {
			case PlayerStatus.Walk_L:
				return level.neighbours[0];
			case PlayerStatus.Walk_U:
				return level.neighbours[1];
			case PlayerStatus.Walk_R:
				return level.neighbours[2];
			case PlayerStatus.Walk_D:
				return level.neighbours[3];
			default:
				return 0;
        }
    }

	function moveTo(world: IWorld, player: number, action: PlayerStatus) {
		if (tween?.isPlaying() ?? false) {
			return;
		}

		const next1 = getMapTile(player, action, 1);
		if (next1 == SpriteType.Wall) {
			updateTween(player, PlayerStatus.None);
			setPushStatus(player, action);
		}
		else if (next1 == SpriteType.BoxNormal) {
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
		else if (next1 == SpriteType.Out)
		{
			const entities = levelQuery(world);
			for (let i = 0; i < entities.length; i++) {
				const id = entities[i];
				const index = Level.index[id];
				const level = Levels[index - 1];
				const new_index = nextMapIndex(level, action);
				Level.index[id] = new_index;
				Level.status[id] = LevelStatus.Load;
			}

			switch (action) {
				case PlayerStatus.Walk_L:
					GridPosition.x[player] = 25;
					break;
				case PlayerStatus.Walk_R:
					GridPosition.x[player] = -1;
					break;
				case PlayerStatus.Walk_U:
					GridPosition.y[player] = 16;
					break;
				case PlayerStatus.Walk_D:
					GridPosition.y[player] = -1;
					break;
            }

			if (tween) {
				tween.remove();
				tween = null;
			}

        }
		else {
			updateTween(player, action);
			Player.status[player] = action;
        }
	}

	function fillMap(world: IWorld) {
		map.clear();
		const tiles = touchableQuery(world);
		for (let i = 0; i < tiles.length; i++) {
			const tile = tiles[i];
			const col = Math.round(GridPosition.x[tile]);
			const row = Math.round(GridPosition.y[tile]);
			switch (Sprite.type[tile]) {
				case SpriteType.Wall:
				case SpriteType.Stone:
					map.set(col, row, SpriteType.Wall);
					break;
				case SpriteType.BoxNormal:
				case SpriteType.BoxPlaced:
				case SpriteType.BoxMoney:
					map.set(col, row, SpriteType.BoxNormal);
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

			if (tween?.isPlaying() ?? false) {
				GridPosition.x[id] = target.x;
				GridPosition.y[id] = target.y;
				target.dt = 0;
			}
			else {
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
						if (tween) {
							tween.remove();
							tween = null;
						}

						GridPosition.x[id] = Math.round(GridPosition.x[id]);
						GridPosition.y[id] = Math.round(GridPosition.y[id]);

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