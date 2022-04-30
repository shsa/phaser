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
import Game from '@/game/components/Game';
import Levels from '@/game/data/Levels';
import Level from '@/game/components/Level';
import Player, { PlayerStatus, getDirection } from '@/game/components/Player';
import Touchable from '@/game/components/Touchable';
import Sprite, { SpriteType } from '@/game/components/Sprite';
import GridPosition from '@/game/components/GridPosition';
import Input, { Direction, getOffset } from '@/game/components/Input';
import { nextTween } from '@/game/helper';
import { LevelMap } from '@/game/data/LevelMap'

export default function createPlayerMovementSystem(tweens: Phaser.Tweens.TweenManager) {
	const gameQuery = defineQuery([Game]);
	const playerQuery = defineQuery([Player, GridPosition, Input]);
	const touchableQuery = defineQuery([Touchable, GridPosition]);

	const target = {
		x: 0,
		y: 0,
		start_x: 0,
		start_y: 0,
		end_x: 0,
		end_y: 0,
		action: PlayerStatus.None,
		dir: Direction.None,
		dt: 0, // time after last action
		update: false,
		complete: false,
	};

	let tween: Phaser.Tweens.Tween | null = null;

	const map = new LevelMap();

	function updateTween(player: number, action: PlayerStatus) {
		tween?.remove();

		if (action != target.action) {
			target.x = GridPosition.x[player];
			target.y = GridPosition.y[player];
			target.action = action;
			tween = null;
		}
		target.end_x = Math.round(target.x);
		target.end_y = Math.round(target.y);

		const dir = getDirection(action);
		const offset = getOffset(dir);
		target.end_x += offset.x;
		target.end_y += offset.y;

		tween = nextTween(tweens, tween, {
			targets: target,
			duration: Options.walk_duration,
			x: target.end_x,
			y: target.end_y,
			ease: Phaser.Math.Easing.Linear,
			delay: 0,
			repeat: 0,
			yoyo: false,
			onComplete: function (t) {
				target.update = false;
				target.complete = true;
			},
			onUpdate: function (t) {
				target.update = true;
				target.complete = false;
            }
		});
		GridPosition.x[player] = target.x;
		GridPosition.y[player] = target.y;
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
			//updateTween(player, PlayerStatus.None);
			setPushStatus(player, action);
			target.action = action;
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
				//updateTween(player, PlayerStatus.None);
				setPushStatus(player, action);
				target.action = action;
			}
		}
		else if (next1 == SpriteType.Out)
		{
			const level_index = Level.index[player];
			const level = Levels[level_index - 1];
			target.action = PlayerStatus.None;
			gameQuery(world).forEach(game => {
				addComponent(world, Level, game);
				Level.index[game] = nextMapIndex(level, action);
            })

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
		playerQuery(world).forEach(player => {
			if (target.update) {
				GridPosition.x[player] = target.x;
				GridPosition.y[player] = target.y;
				target.update = false;
			}
			if (target.complete) {
				GridPosition.x[player] = Math.round(target.x);
				GridPosition.y[player] = Math.round(target.y);
				target.complete = false;
			}

			if (tween?.isPlaying() ?? false) {
				target.dt = 0;
			}
			else {
				target.dt += Options.time_delta;

				switch (Input.direction[player]) {
					case Direction.Left:
						moveTo(world, player, PlayerStatus.Walk_L);
						break;
					case Direction.Right:
						moveTo(world, player, PlayerStatus.Walk_R);
						break;
					case Direction.Up:
						moveTo(world, player, PlayerStatus.Walk_U);
						break;
					case Direction.Down:
						moveTo(world, player, PlayerStatus.Walk_D);
						break;
					default:
						if (target.dt > Options.rest_timeout) {
							Player.status[player] = PlayerStatus.Rest;
						}
						else if (target.dt > Options.idle_timeout) {
							Player.status[player] = PlayerStatus.Idle;
						}
						else {
							Player.status[player] = PlayerStatus.None;
						}
						target.action = Player.status[player];
				}
				Input.direction[player] = Direction.None;
			}
        });
	
		return world;
	})
}