import {
	defineSystem,
	defineQuery,
	addEntity,
	addComponent,
} from 'bitecs';

import Level from '@/game/components/Level';
import Levels from '@/game/data/Levels';

import { getMap } from '@/game/helper';

import Player from '@/game/components/Player';
import GridPosition from '@/game/components/GridPosition';
import Sprite, { SpriteType } from '@/game/components/Sprite';
import Tile from '@/game/components/Tile';

export default function createLevelSystem() {
	const levelQuery = defineQuery([Level]);
	const playerQuery = defineQuery([Player, GridPosition]);

	let currentLevel: any = {};

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
					const block = addEntity(world);
					addComponent(world, GridPosition, block);
					addComponent(world, Sprite, block);
					addComponent(world, Tile, block);
					GridPosition.x[block] = col;
					GridPosition.y[block] = row;
					Sprite.type[block] = map.get(col, row);
					switch (map.getEntity(col, row)) {
						case SpriteType.None:
							break;
						default:
							{
								const entity = addEntity(world);
								addComponent(world, GridPosition, entity);
								addComponent(world, Sprite, entity);
								addComponent(world, Tile, entity);
								GridPosition.x[entity] = col;
								GridPosition.y[entity] = row;
								Sprite.type[entity] = map.getEntity(col, row);
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
