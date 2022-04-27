import {
	IWorld,
	defineSystem,
	defineQuery,
	addEntity,
	addComponent,
} from 'bitecs';

import Level from '@/game/components/Level';
import Levels from '@/game/data/Levels';

import { getMap, LevelMap } from '@/game/helper';

import Player from '@/game/components/Player';
import GridPosition from '@/game/components/GridPosition';
import Sprite, { SpriteType } from '@/game/components/Sprite';
import Tile from '@/game/components/Tile';
import Entity from '@/game/components/Entity';
import Touchable from '@/game/components/Touchable';
import BoxPlace from '@/game/components/BoxPlace';
import Box from '@/game/components/Box';

export default function createLevelSystem() {
	const levelQuery = defineQuery([Level]);
	const playerQuery = defineQuery([Player, GridPosition]);

	let currentLevel: any = {};

	function isTouchable(spriteType: SpriteType): boolean {
		switch (spriteType) {
			case SpriteType.BoxNormal:
			case SpriteType.BoxPlaced:
			case SpriteType.BoxMoney:
			case SpriteType.Wall:
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

	return defineSystem((world) => {
		const entities = levelQuery(world);

		for (let i = 0; i < entities.length; ++i) {
			const id = entities[i];

			const level = Levels[Level.index[id]];
			if (currentLevel == level) {
				break;
			}

			const map = getMap(level);

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
								Sprite.type[entity] = map.getEntity(col, row);
								setTouchable(world, map, col, row, entity);

								if (isBox(map.getEntity(col, row))) {
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
                                }
                            }
                    }
                }
			}

			const player = playerQuery(world);
			for (let i = 0; i < player.length; i++) {
				const player_id = player[i];
				GridPosition.x[player_id] = level.defaultStart.x;
				GridPosition.y[player_id] = level.defaultStart.y;
            }


			currentLevel = level;
		}

		return world;
	});
}
