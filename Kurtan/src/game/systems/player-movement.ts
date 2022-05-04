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
import Position from '@/game/components/Position';
import Input, { Direction, getOffset } from '@/game/components/Input';
import { addTween } from '@/game/helper';
import { LevelMap } from '@/game/data/LevelMap'

enum UpdateFlag {
	None = 0,
	Position = 1,
	Direction = 2,
	Status = 4,
}

export default function createPlayerMovementSystem(tweens: Phaser.Tweens.TweenManager) {
	const gameQuery = defineQuery([Game]);
	const playerQuery = defineQuery([Player, Position, Input]);
	const playerDemoQuery = defineQuery([Player, PlayDemo])
	const playerEnterDemoQuery = enterQuery(playerDemoQuery);
	const touchableQuery = defineQuery([Touchable, Position]);

	const target = {
		x: 0,
		y: 0,
		start_x: 0,
		start_y: 0,
		end_x: 0,
		end_y: 0,
		dt: 0,
		status: PlayerStatus.None,
		duration: 0,
		dir: Direction.None,
		update: UpdateFlag.None,
	};

	let timeline: Phaser.Tweens.Timeline = tweens.createTimeline();

	const map = new LevelMap();

	function updateTween(player: number, dir: Direction, duration: number) {
		if (dir != target.dir) {
			target.x = Position.x[player];
			target.y = Position.y[player];
			timeline.elapsed = timeline.duration;
		}
		target.dir = dir;
		target.end_x = Math.round(target.x);
		target.end_y = Math.round(target.y);

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

		Position.x[player] = target.x;
		Position.y[player] = target.y;
    }

	function getMapTile(player: number, dir: Direction, dist: number): SpriteType {
		const x = Math.round(Position.x[player]);
		const y = Math.round(Position.y[player]);
		const offset = getOffset(dir);
		return map.get(x + offset.x * dist, y + offset.y * dist);
    }

	function getMapTag(player: number, dir: Direction, dist: number): number {
		const x = Math.round(Position.x[player]);
		const y = Math.round(Position.y[player]);
		const offset = getOffset(dir);
		return map.getTag(x + offset.x * dist, y + offset.y * dist);
	}

	function setPushStatus(player: number, dir: Direction) {
		Player.status[player] = Options.walk_duration;
		switch (dir) {
			case Direction.Left:
				Player.status[player] = PlayerStatus.Push_L;
				break;
			case Direction.Right:
				Player.status[player] = PlayerStatus.Push_R;
				break;
			case Direction.Up:
				Player.status[player] = PlayerStatus.Push_U;
				break;
			case Direction.Down:
				Player.status[player] = PlayerStatus.Push_D;
				break;
			default:
				Player.status[player] = PlayerStatus.None;
		}
		target.dir = dir;
    }

	function setStairsStatus(player: number, dir: Direction) {
		const x = Math.round(Position.x[player]);
		const y = Math.round(Position.y[player]);
		target.x = x;
		target.y = y;

		const offset = getOffset(dir);
		const cur = map.get(x, y);
		const next = map.get(x + offset.x, y + offset.y);

		timeline.destroy();
		timeline = tweens.timeline();

		if (cur == SpriteType.Space) {
			if (dir == Direction.Up) {
				timeline.add({
					targets: target,
					duration: Options.walk_duration * 0.7,
					x: target.x,
					y: target.y,
					repeat: 0,
					onStart: function (t: Phaser.Tweens.Tween) {
						target.status = PlayerStatus.Walk_U_Stairs_Start0;
						target.duration = t.duration;
						target.update = UpdateFlag.Status;
                    }
				});

				timeline.add({
					targets: target,
					duration: Options.walk_duration * 0.5,
					x: x + offset.x,
					y: y + offset.y,
					repeat: 0,
					onStart: function (t: Phaser.Tweens.Tween) {
						target.x = x + offset.x * 0.5;
						target.y = y + offset.y * 0.5;
						target.status = PlayerStatus.Walk_U_Stairs_Start1;
						target.duration = t.duration;
						target.update = UpdateFlag.Status | UpdateFlag.Position;
                    },
					onUpdate: function () {
						target.update = UpdateFlag.Position;
					},
					onComplete: function () {
						timeline.destroy();
						target.dir = dir;
						target.update = UpdateFlag.Direction;
					}
				});
			}
			else {
				timeline.add({
					targets: target,
					duration: Options.walk_duration * 0.5,
					x: x,
					y: y,
					repeat: 0,
					onStart: function (t: Phaser.Tweens.Tween) {
						target.status = PlayerStatus.Walk_D_Stairs_Start0;
						target.duration = t.duration;
						target.update = UpdateFlag.Status;
                    }
				});

				timeline.add({
					targets: target,
					duration: Options.walk_duration * 0.3,
					x: x + offset.x * 0.5,
					y: y + offset.y * 0.5,
					repeat: 0,
					onStart: function (t: Phaser.Tweens.Tween) {
						target.x = x + offset.x * 0.5;
						target.y = y + offset.y * 0.5;
						target.status = PlayerStatus.Walk_D_Stairs_Start1;
						target.duration = t.duration;
						target.update = UpdateFlag.Status | UpdateFlag.Position;
					}
				});

				timeline.add({
					targets: target,
					duration: Options.walk_duration * 0.5,
					x: x + offset.x,
					y: y + offset.y,
					repeat: 0,
					onStart: function (t: Phaser.Tweens.Tween) {
						target.status = PlayerStatus.Walk_D_Stairs;
						target.duration = Options.walk_duration;
						target.update = UpdateFlag.Status;
                    },
					onUpdate: function () {
						target.update = UpdateFlag.Position;
					},
					onComplete: function () {
						timeline.destroy();
						target.dir = dir;
						target.update = UpdateFlag.Direction;
					}
				});
			}
		}
		else if (cur == SpriteType.Stairs || cur == SpriteType.Out) {
			if (next == SpriteType.Stairs) {
				timeline.add({
					targets: target,
					duration: Options.walk_duration,
					x: x + offset.x,
					y: y + offset.y,
					onUpdate: function () {
						target.update = UpdateFlag.Position;
					},
					onComplete: function () {
						timeline.destroy();
						target.dir = dir;
						target.update = UpdateFlag.Direction;
					}
				});
				if (dir == Direction.Up) {
					Player.status[player] = PlayerStatus.Walk_U_Stairs;
				}
				else {
					Player.status[player] = PlayerStatus.Walk_D_Stairs;
                }
            }
			else if (next == SpriteType.Space) {
				if (dir == Direction.Up) {
					timeline.add({
						targets: target,
						duration: Options.walk_duration * 0.5,
						x: x + offset.x * 0.5,
						y: y + offset.y * 0.5,
						repeat: 0,
						onStart: function (t: Phaser.Tweens.Tween) {
							target.status = PlayerStatus.Walk_U_Stairs;
							target.duration = Options.walk_duration;
							target.update = UpdateFlag.Status;
                        },
						onUpdate: function () {
							target.update = UpdateFlag.Position;
						}
					});

					timeline.add({
						targets: target,
						duration: Options.walk_duration * 0.35,
						x: x + offset.x * 0.5,
						y: y + offset.y * 0.5,
						repeat: 0,
						onStart: function (t: Phaser.Tweens.Tween) {
							target.status = PlayerStatus.Walk_U_Stairs_End0;
							target.duration = t.duration;
							target.update = UpdateFlag.Status;
                        }
					});

					timeline.add({
						targets: target,
						duration: Options.walk_duration * 0.5,
						x: x + offset.x,
						y: y + offset.y,
						repeat: 0,
						onStart: function (t: Phaser.Tweens.Tween) {
							target.x = x + offset.x;
							target.y = y + offset.y;
							target.status = PlayerStatus.Walk_U_Stairs_End1;
							target.duration = t.duration;
							target.update = UpdateFlag.Position | UpdateFlag.Status;
						}
					});
				}
				else {
					timeline.add({
						targets: target,
						duration: Options.walk_duration * 0.6,
						x: x + offset.x * 0.6,
						y: y + offset.y * 0.6,
						repeat: 0,
						onStart: function (t: Phaser.Tweens.Tween) {
							target.status = PlayerStatus.Walk_D_Stairs;
							target.duration = t.duration;
							target.update = UpdateFlag.Status;
                        },
						onUpdate: function () {
							target.update = UpdateFlag.Position;
                        }
					});

					timeline.add({
						targets: target,
						duration: Options.walk_duration * 0.5,
						x: x + offset.x * 0.6,
						y: y + offset.y * 0.6,
						repeat: 0,
						onStart: function (t: Phaser.Tweens.Tween) {
							target.status = PlayerStatus.Walk_D_Stairs_End0;
							target.duration = t.duration;
							target.update = UpdateFlag.Status;
                        }
					});

					timeline.add({
						targets: target,
						duration: Options.walk_duration * 0.5,
						x: x + offset.x,
						y: y + offset.y,
						repeat: 0,
						onStart: function (t: Phaser.Tweens.Tween) {
							target.x = x + offset.x;
							target.y = y + offset.y;
							target.status = PlayerStatus.Walk_D_Stairs_End1;
							target.duration = t.duration;
							target.update = UpdateFlag.Position | UpdateFlag.Status;
                        },
						onUpdate: function () {
							target.update = UpdateFlag.Position;
						}
					});

					timeline.add({
						targets: target,
						duration: Options.walk_duration * 0.2,
						x: x + offset.x,
						y: y + offset.y,
						repeat: 0,
						onStart: function (t: Phaser.Tweens.Tween) {
							target.x = x + offset.x;
							target.y = y + offset.y;
							target.status = PlayerStatus.Walk_D_Stairs_End2;
							target.duration = t.duration;
							target.update = UpdateFlag.Position | UpdateFlag.Status;
						},
						onUpdate: function () {
							target.update = UpdateFlag.Position;
						}
					});
				}
            }
        }
		timeline.play();
    }

	function nextMapIndex(level: any, dir: Direction): number {
		switch (dir) {
			case Direction.Left:
				return level.neighbours[0];
			case Direction.Up:
				return level.neighbours[1];
			case Direction.Right:
				return level.neighbours[2];
			case Direction.Down:
				return level.neighbours[3];
			default:
				return 0;
        }
    }

	function moveTo(world: IWorld, player: number, dir: Direction) {
		if (timeline.isPlaying()) {
			return;
		}

		const next1 = getMapTile(player, dir, 1);
		if (next1 == SpriteType.Wall) {
			setPushStatus(player, dir);
		}
		else if (next1 == SpriteType.BoxNormal) {
			if (getMapTile(player, dir, 2) == SpriteType.Space) {
				updateTween(player, dir, Options.walk_duration);
				const tile = getMapTag(player, dir, 1);
				if (!hasComponent(world, Input, tile)) {
					addComponent(world, Input, tile);
				}
				Input.direction[tile] = Input.direction[player];
				setPushStatus(player, dir);
			}
			else {
				setPushStatus(player, dir);
			}
		}
		else if (next1 == SpriteType.DoorClosed) {
			setPushStatus(player, dir);
		}
		else if (next1 == SpriteType.Out)
		{
			const level_index = Level.index[player];
			const level = Levels[level_index - 1];
			gameQuery(world).forEach(game => {
				addComponent(world, Level, game);
				Level.index[game] = nextMapIndex(level, dir);
            })

			switch (dir) {
				case Direction.Left:
					Position.x[player] = 25;
					break;
				case Direction.Right:
					Position.x[player] = -1;
					break;
				case Direction.Up:
					Position.y[player] = 16;
					break;
				case Direction.Down:
					Position.y[player] = -1;
					break;
			}
			target.dir = dir;
			target.x = Position.x[player];
			target.y = Position.y[player];
			timeline.destroy();
			timeline = timeline.manager.timeline();
			target.update = UpdateFlag.Direction;
        }
		else if (next1 == SpriteType.Stairs) {
			setStairsStatus(player, dir);
		}
		else {
			if (getMapTile(player, dir, 0) == SpriteType.Stairs) {
				setStairsStatus(player, dir);
			}
			else {
				updateTween(player, dir, Options.walk_duration);
				Player.duration[player] = Options.walk_duration;
				switch (dir) {
					case Direction.Left:
						Player.status[player] = PlayerStatus.Walk_L;
						break;
					case Direction.Right:
						Player.status[player] = PlayerStatus.Walk_R;
						break;
					case Direction.Up:
						Player.status[player] = PlayerStatus.Walk_U;
						break;
					case Direction.Down:
						Player.status[player] = PlayerStatus.Walk_D;
						break;
					case Direction.None:
						Player.status[player] = PlayerStatus.Idle;
						break;
                }
            }
        }
	}

	function fillMap(world: IWorld) {
		map.clear();
		const tiles = touchableQuery(world);
		for (let i = 0; i < tiles.length; i++) {
			const tile = tiles[i];
			const col = Math.round(Position.x[tile]);
			const row = Math.round(Position.y[tile]);
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
			timeline = tweens.timeline();
			target.update = UpdateFlag.None;
			Input.direction[player] = Direction.None;
		});

		fillMap(world);
		playerQuery(world).forEach(player => {
			if ((target.update & UpdateFlag.Position) == UpdateFlag.Position) {
				Position.x[player] = target.x;
				Position.y[player] = target.y;
				target.update &= ~UpdateFlag.Position;
			}

			if ((target.update & UpdateFlag.Status) == UpdateFlag.Status) {
				Player.status[player] = target.status;
				Player.duration[player] = target.duration;
				target.update &= ~UpdateFlag.Status;
			}

			if ((target.update & UpdateFlag.Direction) == UpdateFlag.Direction) {
				target.update &= ~UpdateFlag.Direction;
				Input.direction[player] = target.dir;
			}

			if (timeline.isPlaying()) {
				target.dt = 0;
			}
			else {
				target.dt += Options.time_delta;
				const dir = Input.direction[player];
				switch (dir) {
					case Direction.Left:
					case Direction.Right:
					case Direction.Up:
					case Direction.Down:
						moveTo(world, player, dir);
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