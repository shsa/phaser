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
import Position from '@/game/components/Position';
import Sprite, { SpriteType } from '@/game/components/Sprite';
import Tile from '@/game/components/Tile';
import Entity from '@/game/components/Entity';
import Touchable from '@/game/components/Touchable';
import BoxPlace from '@/game/components/BoxPlace';
import Box from '@/game/components/Box';
import PlayDemo from '@/game/components/PlayDemo'
import Destroy from '@/game/components/Destroy'
import Visible from '../components/Visible';
import Apple from '../components/Apple';

export default function createLevelLoaderSystem() {
	const gameQuery = defineQuery([Game]);
	const playerQuery = defineQuery([Player, Position, Level]);
	const tileQuery = defineQuery([Tile, Sprite]);
	const entityQuery = defineQuery([Entity, Sprite]);

	function clear(world: IWorld, query: Query<IWorld>) {
		query(world).forEach(id => {
			addComponent(world, Destroy, id);
			removeComponent(world, Touchable, id);
        });
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
					case 'A':
						map.set(col, row, SpriteType.Space);
						map.setEntity(col, row, SpriteType.AppleHidden);
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
				addComponent(world, Position, tile);
				addComponent(world, Sprite, tile);
				addComponent(world, Tile, tile);
				Position.x[tile] = col;
				Position.y[tile] = row;
				const spriteType = map.get(col, row);
				Sprite.type[tile] = spriteType;
				switch (spriteType) {
					case SpriteType.Wall:
						addComponent(world, Touchable, tile);
						break;
					case SpriteType.BoxPlace:
						addComponent(world, BoxPlace, tile);
						break;
				}
			}
		}

		for (let i = 0; i < map.entities.length; i++) {
			const item = map.entities[i];

			const col = item.x;
			const row = item.y;
			switch (item.type) {
				case SpriteType.None:
					break;
				default:
					{
						const entity = addEntity(world);
						addComponent(world, Position, entity);
						addComponent(world, Sprite, entity);
						addComponent(world, Entity, entity);
						addComponent(world, Visible, entity);
						Position.x[entity] = item.x;
						Position.y[entity] = item.y;
						Sprite.type[entity] = item.type;

						switch (item.type) {
							case SpriteType.BoxNormal:
							case SpriteType.BoxMoney:
							case SpriteType.BoxPlaced:
								{
									addComponent(world, Box, entity);
									Box.money[entity] = item.type == SpriteType.BoxNormal ? 0 : 1;
									if (map.get(col, row) == SpriteType.BoxPlace) {
										if (Box.money[entity] == 1) {
											Sprite.type[entity] = SpriteType.BoxMoney;
										} else {
											Sprite.type[entity] = SpriteType.BoxPlaced;
										}
									} else {
										Sprite.type[entity] = SpriteType.BoxNormal;
									}
									addComponent(world, Touchable, entity);
									break;
								}
							case SpriteType.DoorClosed:
								addComponent(world, Touchable, entity);
								break;
							case SpriteType.Stairs:
								addComponent(world, Touchable, entity);
								break;
							case SpriteType.Apple:
								removeComponent(world, Visible, entity);
								addComponent(world, Apple, entity);
								break;
						}
					}
			}
		}

		const width = map.width + 1;
		for (let row = 0; row <= map.height; row++) {
			for (let col = 0; col <= width; col++) {
				if (row >= 0 && row < map.height) {
					if (col >= 0 && col < map.width) {
						continue;
					}
				}

				const tile = addEntity(world);
				addComponent(world, Position, tile);
				addComponent(world, Sprite, tile);
				addComponent(world, Tile, tile);
				Position.x[tile] = col;
				Position.y[tile] = row;
				Sprite.type[tile] = SpriteType.BackgroundUI;
			}
		}

		removeComponent(world, Level, game);

		playerQuery(world).forEach(player => {
			Level.index[player] = level_index;

			if (Player.status[player] == PlayerStatus.Start || hasComponent(world, PlayDemo, player)) {
				Position.x[player] = level.defaultStart.x;
				Position.y[player] = level.defaultStart.y;

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
			const x = Position.x[id];
			const y = Position.y[id];
			map.set(x, y, Sprite.type[id]);
		});

		entityQuery(world).forEach(id => {
			const x = Position.x[id];
			const y = Position.y[id];
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
