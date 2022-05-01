import {
	IWorld,
	Query,
	defineSystem,
	defineQuery,
	addEntity,
	addComponent,
	removeComponent,
    hasComponent
} from 'bitecs';

import Level, { nextLevel } from '@/game/components/Level';
import Levels from '@/game/data/Levels';

import { LevelMap } from '@/game/data/LevelMap';
import { first } from '@/game/helper'

import Game from '@/game/components/Game';
import Player, { PlayerStatus } from '@/game/components/Player';
import GridPosition from '@/game/components/GridPosition';
import Sprite, { SpriteType } from '@/game/components/Sprite';
import Tile from '@/game/components/Tile';
import Entity from '@/game/components/Entity';
import Touchable from '@/game/components/Touchable';
import BoxPlace from '@/game/components/BoxPlace';
import Box from '@/game/components/Box';
import PlayDemo from '@/game/components/PlayDemo'
import Destroy from '@/game/components/Destroy'

export default function createLevelLoaderSystem() {
	const gameQuery = defineQuery([Game]);
	const playerQuery = defineQuery([Player, GridPosition, Level]);
	const tileQuery = defineQuery([Tile, Sprite]);
	const entityQuery = defineQuery([Entity, Sprite]);

	function isTouchable(spriteType: SpriteType): boolean {
		switch (spriteType) {
			case SpriteType.BoxNormal:
			case SpriteType.BoxPlaced:
			case SpriteType.BoxMoney:
			case SpriteType.Wall:
			case SpriteType.DoorClosed:
				return true;
			default:
				return false;
        }
    }

	function setTouchable(world: IWorld, map: LevelMap, col: number, row: number, id: number) {
		if (isTouchable(map.get(col, row))) {
			addComponent(world, Touchable, id);
			return;
		}
		if (isTouchable(map.getEntity(col, row))) {
			addComponent(world, Touchable, id);
			return;
        }
    }

	function isBox(spriteType: SpriteType): boolean {
		switch (spriteType) {
			case SpriteType.BoxNormal:
			case SpriteType.BoxPlaced:
			case SpriteType.BoxMoney:
				return true;
			default:
				return false;
		}
	}

	function clear(world: IWorld, query: Query<IWorld>) {
		const entities = query(world);
		for (let i = 0; i < entities.length; i++) {
			const id = entities[i];
			addComponent(world, Destroy, id);
			removeComponent(world, Touchable, id);
        }
    }

	function loadMap(level: any): LevelMap {
		if (typeof (level) == "number") {
			level = Levels[level];
		}

		if (level.map instanceof LevelMap) {
			return level.map;
        }
		const map = new LevelMap();
		level.map = map;
		for (let row = 0; row < level.data.length; row++) {
			const line = level.data[row];
			for (let col = 0; col < line.length; col++) {
				switch (line[col]) {
					case '1':
						map.set(col, row, SpriteType.Wall);
						break;
					case '0':
						map.set(col, row, SpriteType.Space);
						break;
					case '2':
						map.set(col, row, SpriteType.BoxPlace);
						break;
					case '3':
						map.set(col, row, SpriteType.Space);
						map.setEntity(col, row, SpriteType.BoxNormal);
						break;
					case '5':
						map.set(col, row, SpriteType.Space);
						map.setEntity(col, row, SpriteType.BoxMoney);
						break;
					case '7':
						map.set(col, row, SpriteType.Space);
						map.setEntity(col, row, SpriteType.DoorClosed);
						break;
					case '?':
						map.set(col, row, SpriteType.Space);
						map.setEntity(col, row, SpriteType.Secret);
						break;
					case 'H':
						map.set(col, row, SpriteType.Space);
						map.setEntity(col, row, SpriteType.Stairs);
						break;
					default:
						map.set(col, row, SpriteType.Error);
						break;
				}
			}
		}

		for (let row = 0; row < map.height; row++) {
			for (let col = 0; col < map.width; col++) {
				if (map.isWall(col, row)) {
					let isStone = true;
					for (let dy = -1; dy <= 1; dy++) {
						for (let dx = -1; dx <= 1; dx++) {
							isStone &&= map.isWall(col + dx, row + dy);
						}
					}
					if (isStone) {
						map.set(col, row, SpriteType.Stone);
					}
				}
			}
		}

		return map;
	}

	function load(world: IWorld, game: number) {
		const level_index = Level.index[game];
		const level = Levels[level_index - 1];
		console.log("level:", level_index);

		clear(world, tileQuery);
		clear(world, entityQuery);

		if (hasComponent(world, PlayDemo, game)) {
			(level as any).map = undefined;
			removeComponent(world, PlayDemo, game);
        }

		const map = loadMap(level);

		for (let row = 0; row < map.height; row++) {
			for (let col = 0; col < map.width; col++) {
				const tile = addEntity(world);
				addComponent(world, GridPosition, tile);
				addComponent(world, Sprite, tile);
				addComponent(world, Tile, tile);
				GridPosition.x[tile] = col;
				GridPosition.y[tile] = row;
				Sprite.type[tile] = map.get(col, row);
				setTouchable(world, map, col, row, tile);

				if (map.get(col, row) == SpriteType.BoxPlace) {
					addComponent(world, BoxPlace, tile);
				}

				switch (map.getEntity(col, row)) {
					case SpriteType.None:
						break;
					default:
						{
							const entity = addEntity(world);
							addComponent(world, GridPosition, entity);
							addComponent(world, Sprite, entity);
							addComponent(world, Entity, entity);
							GridPosition.x[entity] = col;
							GridPosition.y[entity] = row;
							const type = map.getEntity(col, row);
							Sprite.type[entity] = type;

							switch (map.getEntity(col, row)) {
								case SpriteType.BoxNormal:
								case SpriteType.BoxMoney:
								case SpriteType.BoxPlaced:
									{
										addComponent(world, Box, entity);
										Box.money[entity] = map.getEntity(col, row) == SpriteType.BoxNormal ? 0 : 1;
										if (map.get(col, row) == SpriteType.BoxPlace) {
											if (Box.money[entity] == 1) {
												Sprite.type[entity] = SpriteType.BoxMoney;
											} else {
												Sprite.type[entity] = SpriteType.BoxPlaced;
											}
										} else {
											Sprite.type[entity] = SpriteType.BoxNormal;
										}
										setTouchable(world, map, col, row, entity);
										break;
									}
								case SpriteType.DoorClosed:
									setTouchable(world, map, col, row, entity);
									break;
                            }
						}
				}
			}
		}
		removeComponent(world, Level, game);

		playerQuery(world).forEach(player => {
			Level.index[player] = level_index;

			if (Player.status[player] == PlayerStatus.Start || hasComponent(world, PlayDemo, player)) {
				GridPosition.x[player] = level.defaultStart.x;
				GridPosition.y[player] = level.defaultStart.y;

				Player.status[player] = PlayerStatus.Idle;
			}
		});
    }

	function save(world: IWorld) {
		const player = first(world, playerQuery) || 0;
		const index = Level.index[player];
		if (index == 0) {
			return;
		}

		const level = Levels[index - 1];
		const map = ((level as any).map as LevelMap);
		map.clear();

		tileQuery(world).forEach(id => {
			const x = GridPosition.x[id];
			const y = GridPosition.y[id];
			map.set(x, y, Sprite.type[id]);
		});

		entityQuery(world).forEach(id => {
			const x = GridPosition.x[id];
			const y = GridPosition.y[id];
			map.setEntity(x, y, Sprite.type[id]);
		});
    }

	return defineSystem((world) => {
		gameQuery(world).forEach(game => {
			if (hasComponent(world, PlayDemo, game)) {
				//removeComponent(world, PlayDemo, game);
				playerQuery(world).forEach(player => {
					addComponent(world, Level, game);
					Level.index[game] = Level.index[player];
					addComponent(world, PlayDemo, player);
				});
            }
			if (hasComponent(world, Level, game)) {
				save(world);
				load(world, game);
            }
		});

		return world;
	});
}
