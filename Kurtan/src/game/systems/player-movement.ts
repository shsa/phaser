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
import PlayDemo from '@/game/components/PlayDemo';
import Levels from '@/game/data/Levels';
import Level from '@/game/components/Level';
import Player, { PlayerStatus, getDirection } from '@/game/components/Player';
import Touchable from '@/game/components/Touchable';
import Sprite, { SpriteType } from '@/game/components/Sprite';
import GridPosition from '@/game/components/GridPosition';
import Input, { Direction, getOffset } from '@/game/components/Input';
import { addTween } from '@/game/helper';
import { LevelMap } from '@/game/data/LevelMap'

enum UpdateFlag {
	None = 0,
	Position = 1,
	Status = 2,
	MoveTo = 4
}

export default function createPlayerMovementSystem(tweens: Phaser.Tweens.TweenManager) {
	const gameQuery = defineQuery([Game]);
	const playerQuery = defineQuery([Player, GridPosition, Input]);
	const playerDemoQuery = defineQuery([Player, PlayDemo])
	const playerEnterDemoQuery = enterQuery(playerDemoQuery);
	const touchableQuery = defineQuery([Touchable, GridPosition]);

	const target = {
		x: 0,
		y: 0,
		start_x: 0,
		start_y: 0,
		end_x: 0,
		end_y: 0,
		dt: 0,
		status: PlayerStatus.None,
		dir: Direction.None,
		update: UpdateFlag.None,
	};

	let timeline: Phaser.Tweens.Timeline = tweens.createTimeline();

	const map = new LevelMap();

	function updateTween(player: number, action: PlayerStatus, duration: number) {
		if (action != target.status) {
			target.x = GridPosition.x[player];
			target.y = GridPosition.y[player];
			timeline.elapsed = timeline.duration;
		}
		target.status = action;
		target.end_x = Math.round(target.x);
		target.end_y = Math.round(target.y);

		const dir = getDirection(action);
		const offset = getOffset(dir);
		target.end_x += offset.x;
		target.end_y += offset.y;

		timeline = addTween(timeline, {
			targets: target,
			duration: duration,
			x: target.end_x,
			y: target.end_y,
			ease: Phaser.Math.Easing.Linear,
			delay: 0,
			repeat: 0,
			yoyo: false,
			onComplete: function() {
				target.update = UpdateFlag.Position;
			},
			onUpdate: function() {
				target.update = UpdateFlag.Position;
            }
		});
		timeline.play();

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
			case PlayerStatus.None:
				return map.get(x, y);
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

	function setStairsStatus(player: number, action: PlayerStatus) {
		const offset = getOffset(getDirection(action));
		let x = GridPosition.x[player];
		let y = GridPosition.y[player];
		target.x = x;
		target.y = y;

		const cur = map.get(x, y);

		timeline.destroy();
		timeline = tweens.timeline();

		let status = PlayerStatus.None;

		if (cur == SpriteType.Space) {
			if (action == PlayerStatus.Walk_U) {
				status = PlayerStatus.Walk_U_Stairs;

				target.x = x + offset.x * 0.6;
				target.y = y + offset.y * 0.6;
				target.status = PlayerStatus.Walk_U_Stairs_Start;
				target.update = UpdateFlag.Status;

				timeline.add({
					targets: target,
					duration: Options.walk_stairs_start * 0.5,
					x: target.x,
					y: target.y,
					repeat: 0
				});

				x = x + offset.x;
				y = y + offset.y;
				timeline.add({
					targets: target,
					duration: Options.walk_stairs_start * 0.5,
					x: x,
					y: y,
					repeat: 0,
					onUpdate: function () {
						target.update = UpdateFlag.Position;
					}
				});
			}
			else {
				status = PlayerStatus.Walk_D_Stairs;

				target.x = x + offset.x * 0.4;
				target.y = y + offset.y * 0.4;
				target.status = PlayerStatus.Walk_D_Stairs_Start;
				target.update = UpdateFlag.Status;

				timeline.add({
					targets: target,
					duration: Options.walk_stairs_start * 0.3,
					x: target.x,
					y: target.y,
					repeat: 0
				});

				x = x + offset.x;
				y = y + offset.y;
				timeline.add({
					targets: target,
					duration: Options.walk_stairs_start * 0.7,
					x: x,
					y: y,
					repeat: 0,
					onUpdate: function () {
						target.update = UpdateFlag.Position;
					}
				});
			}
		}

		x = x + offset.x;
		y = y + offset.y;
		while (map.get(x, y) == SpriteType.Stairs) {
			timeline.add({
				targets: target,
				duration: Options.walk_duration,
				x: x,
				y: y,
				repeat: 0,
				onStart: function () {
					target.status = status;
					target.update = UpdateFlag.Status;
                },
				onUpdate: function () {
					target.update = UpdateFlag.Position;
				}
			});
			x = x + offset.x;
			y = y + offset.y;
        }

		if (map.get(x, y) == SpriteType.Space) {
			if (action == PlayerStatus.Walk_U) {
				timeline.add({
					targets: target,
					duration: Options.walk_stairs_start * 0.5,
					x: x,
					y: y,
					repeat: 0,
					onStart: function () {
						target.status = PlayerStatus.Walk_U_Stairs_End;
						target.update = UpdateFlag.Status;
					}
				});

				timeline.add({
					targets: target,
					duration: Options.walk_stairs_start * 0.5,
					x: x + offset.x,
					y: y + offset.y,
					repeat: 0,
					onUpdate: function () {
						target.update = UpdateFlag.Position;
					}
				});
			}
			else {
				target.x = x + offset.x * 0.4;
				target.y = y + offset.y * 0.4;
				target.status = PlayerStatus.Walk_D_Stairs_Start;

				timeline.add({
					targets: target,
					duration: Options.walk_stairs_start * 0.3,
					x: target.x,
					y: target.y,
					repeat: 0
				});

				timeline.add({
					targets: target,
					duration: Options.walk_stairs_start * 0.7,
					x: x + offset.x,
					y: y + offset.y,
					repeat: 0,
					onUpdate: function () {
						target.update = UpdateFlag.Position;
					}
				});
			}
		}
		else if (map.get(x, y) == SpriteType.Out) {
			timeline.add({
				targets: target,
				duration: 0,
				x: x,
				y: y,
				repeat: 0,
				onStart: function () {
					target.status = action;
					target.update = UpdateFlag.MoveTo;
					timeline.stop();
				}
			});
        }
		timeline.play();
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
		if (timeline.isPlaying()) {
			return;
		}

		const next1 = getMapTile(player, action, 1);
		if (next1 == SpriteType.Wall) {
			//updateTween(player, PlayerStatus.None);
			setPushStatus(player, action);
			target.status = action;
		}
		else if (next1 == SpriteType.BoxNormal) {
			if (getMapTile(player, action, 2) == SpriteType.Space) {
				updateTween(player, action, Options.walk_duration);
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
				target.status = action;
			}
		}
		else if (next1 == SpriteType.DoorClosed) {
			setPushStatus(player, action);
			target.status = action;
		}
		else if (next1 == SpriteType.Stairs)
		{
			setStairsStatus(player, action);
		}
		else if (next1 == SpriteType.Out)
		{
			const level_index = Level.index[player];
			const level = Levels[level_index - 1];
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
			target.status = action;
			target.update = UpdateFlag.MoveTo;
        }
		else {
			if (getMapTile(player, PlayerStatus.None, 0) == SpriteType.Stairs) {
				setStairsStatus(player, action);
			}
			else {
				updateTween(player, action, Options.walk_duration);
				Player.status[player] = action;
            }
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
					break;
				case SpriteType.DoorClosed:
					map.set(col, row, SpriteType.DoorClosed);
					break;
				case SpriteType.Stairs:
					map.set(col, row, SpriteType.Stairs);
					break;
            }
		}
    }

	return defineSystem((world) => {
		playerEnterDemoQuery(world).forEach(player => {
			timeline.destroy();
			target.update = UpdateFlag.None;
			Input.direction[player] = Direction.None;
		});

		fillMap(world);
		playerQuery(world).forEach(player => {
			if ((target.update & UpdateFlag.Position) == UpdateFlag.Position) {
				GridPosition.x[player] = target.x;
				GridPosition.y[player] = target.y;
				target.update &= ~UpdateFlag.Position;
			}

			if ((target.update & UpdateFlag.Status) == UpdateFlag.Status) {
				Player.status[player] = target.status;
				target.update &= ~UpdateFlag.Status;
			}

			if ((target.update & UpdateFlag.MoveTo) == UpdateFlag.MoveTo) {
				target.update &= ~UpdateFlag.MoveTo;
				moveTo(world, player, target.status);
			}

			if (target.update !== UpdateFlag.None) {
				return world;
            }

			if (timeline.isPlaying()) {
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
						target.status = Player.status[player];
				}
				Input.direction[player] = Direction.None;
			}
        });
	
		return world;
	})
}