import Phaser, { Time } from 'phaser';
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
		i: 0,
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
	const map_info = {
		completed: false,
		box_money: 0,
		box_type: SpriteType.None
	};

	function timeline_clear() {
		timeline.destroy();
		timeline = tweens.timeline();
    }

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

		timeline_clear();
		timeline = tweens.timeline();

		if (cur == SpriteType.Space) {
			if (dir == Direction.Up) {
				timeline.add({
					targets: target,
					duration: Options.walk_duration * 2,
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
					duration: Options.walk_duration,
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
						timeline_clear();
						target.dir = dir;
						target.update = UpdateFlag.Direction;
					}
				});
			}
			else {
				timeline.add({
					targets: target,
					duration: Options.walk_duration,
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
						timeline_clear();
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
						timeline_clear();
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
						duration: Options.walk_duration * 2,
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
						duration: Options.walk_duration * 2,
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

	function moveTo(world: IWorld, player: number, dir: Direction): boolean {
		if (timeline.isPlaying()) {
			return false;
		}

		const next1 = getMapTile(player, dir, 1);
		if (next1 == SpriteType.Wall) {
			setPushStatus(player, dir);
			return false;
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
				return true;
			}
			else {
				setPushStatus(player, dir);
				return false;
			}
		}
		else if (next1 == SpriteType.BoxOpened) {
			target.status = PlayerStatus.Hidden;
			target.update = UpdateFlag.Status;

			timeline_clear();
			timeline.add({
				targets: target,
				i: 0,
				duration: Options.box_take,
				onComplete: function () {
					target.status = PlayerStatus.WithMoney;
					target.update = UpdateFlag.Status;
                }
			});
			timeline.play();
			return false;
        }
		else if (next1 == SpriteType.DoorClosed) {
			setPushStatus(player, dir);
			return false;
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
			timeline_clear();
			timeline = timeline.manager.timeline();
			target.update = UpdateFlag.Direction;
			return true;
        }
		else if (next1 == SpriteType.Stairs) {
			setStairsStatus(player, dir);
			return true;
		}
		else {
			if (getMapTile(player, dir, 0) == SpriteType.Stairs) {
				setStairsStatus(player, dir);
				return true;
			}
			else {
				updateTween(player, dir, Options.walk_duration);
				Player.duration[player] = Options.walk_duration;
				switch (dir) {
					case Direction.Left:
						Player.status[player] = PlayerStatus.Walk_L;
						return true;
					case Direction.Right:
						Player.status[player] = PlayerStatus.Walk_R;
						return true;
					case Direction.Up:
						Player.status[player] = PlayerStatus.Walk_U;
						return true;
					case Direction.Down:
						Player.status[player] = PlayerStatus.Walk_D;
						return true;
					case Direction.None:
						Player.status[player] = PlayerStatus.Idle;
						return false;
                }
            }
        }
	}

	function processInput(world: IWorld, player: number) {
		const dir = Input.direction[player];
		switch (dir) {
			case Direction.Left:
			case Direction.Right:
			case Direction.Up:
			case Direction.Down:
				if (moveTo(world, player, dir)) {
					switch (dir) {
						case Direction.Left:
							s = s + ", 0";
							break;
						case Direction.Right:
							s = s + ", 1";
							break;
						case Direction.Up:
							s = s + ", 2";
							break;
						case Direction.Down:
							s = s + ", 3";
							break;
					}
					if (map_info.completed) {
						console.log(s);
					}
				}
				break;
			default:
				if (target.dt > Options.rest_timeout) {
					Player.status[player] = PlayerStatus.Rest;
				}
				else if (target.dt > Options.idle_timeout) {
					Player.status[player] = PlayerStatus.Idle;
				}
				else {
					//Player.status[player] = PlayerStatus.None;
				}
				target.status = Player.status[player];
		}
		Input.direction[player] = Direction.None;
    }

	function fillMap(world: IWorld) {
		map.clear();
		map_info.completed = true;
		map_info.box_money = -1;
		map_info.box_type = SpriteType.None;

		const tiles = touchableQuery(world);
		tiles.forEach(tile => {
			const col = Math.round(Position.x[tile]);
			const row = Math.round(Position.y[tile]);
			const tile_type = Sprite.type[tile];
			switch (tile_type) {
				case SpriteType.Wall:
				case SpriteType.Stone:
					map.set(col, row, SpriteType.Wall);
					break;
				case SpriteType.BoxNormal:
				case SpriteType.BoxPlaced:
				case SpriteType.BoxMoney:
				case SpriteType.BoxOpen:
				case SpriteType.BoxTake:
				case SpriteType.BoxEmpty:
					map.set(col, row, SpriteType.BoxNormal);
					map.setTag(col, row, tile);
					break;
				case SpriteType.BoxOpened:
					map.set(col, row, SpriteType.BoxOpened);
					map.setTag(col, row, tile);
					break;
				case SpriteType.DoorClosed:
					map.set(col, row, SpriteType.DoorClosed);
					break;
				case SpriteType.Stairs:
					map.set(col, row, SpriteType.Stairs);
					break;
			}
			switch (tile_type) {
				case SpriteType.BoxNormal:
					map_info.completed = false;
					break;
				case SpriteType.BoxMoney:
				case SpriteType.BoxOpen:
				case SpriteType.BoxOpened:
				case SpriteType.BoxTake:
				case SpriteType.BoxEmpty:
					map_info.box_money = tile;
					map_info.box_type = tile_type;
					break;
			}
		});
	}

	let s = "";
	return defineSystem((world) => {
		playerEnterDemoQuery(world).forEach(player => {
			timeline_clear();
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

				if (target.status == PlayerStatus.Hidden) {
					Sprite.type[map_info.box_money] = SpriteType.BoxTake;
				}
				if (target.status == PlayerStatus.WithMoney) {
					Sprite.type[map_info.box_money] = SpriteType.BoxEmpty;
				}

				target.update &= ~UpdateFlag.Status;
			}
			else {
				Player.status[player] = PlayerStatus.None;
			}

			if ((target.update & UpdateFlag.Direction) == UpdateFlag.Direction) {
				Input.direction[player] = target.dir;
				target.update &= ~UpdateFlag.Direction;
			}

			if (timeline.isPlaying()) {
				target.dt = 0;
			}
			else {
				target.dt += Options.time_delta;

				if (!hasComponent(world, PlayDemo, player) && map_info.completed) {
					if (map_info.box_type == SpriteType.BoxMoney) {
						Sprite.type[map_info.box_money] = SpriteType.BoxOpen;
						timeline_clear();
						timeline.add({
							targets: target,
							i: 0,
							duration: Options.walk_duration,
							repeat: 0
						});
						timeline.add({
							targets: target,
							i: 0,
							duration: Options.box_open,
							repeat: 0
						});
						timeline.play();
						Player.status[player] = PlayerStatus.Idle;
					}
					else if (map_info.box_type == SpriteType.BoxOpen) {
						Sprite.type[map_info.box_money] = SpriteType.BoxOpened;
						Player.status[player] = PlayerStatus.Applause;
						Player.duration[player] = Options.applause_duration;
						timeline_clear();
						timeline.add({
							targets: target,
							i: 0,
							duration: Options.applause_duration,
							repeat: 0,
							onComplete: function () {
								target.status = PlayerStatus.Smile;
								target.update = UpdateFlag.Status;
							}
						});
						timeline.play();
                    }
					else {
						processInput(world, player);
                    }
				}
				else {
					processInput(world, player);
				}
			}
        });
	
		return world;
	})
}