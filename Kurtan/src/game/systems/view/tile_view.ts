import Phaser from 'phaser';
import {
	defineSystem,
	defineQuery,
	enterQuery,
	exitQuery
} from 'bitecs';

import Tile from '@/game/components/Tile';
import GridPosition from '@/game/components/GridPosition';
import Sprite, { SpriteType } from '@/game/components/Sprite';
import Options from '@/game/Options';

export default function createTileViewSystem(scene: Phaser.Scene) {
	const spritesById = new Map<number, Phaser.GameObjects.Sprite>();

	const spriteQuery = defineQuery([Tile, GridPosition, Sprite]);
	
	const spriteQueryEnter = enterQuery(spriteQuery);
	const spriteQueryExit = exitQuery(spriteQuery);

	function addTile(key: string): Phaser.GameObjects.Sprite {
		const result = scene.add.sprite(0, 0, key);
		result.setDepth(0);
		return result;
    }

	function addSprite(type: SpriteType): Phaser.GameObjects.Sprite {
		switch (type) {
			case SpriteType.Wall:
				return addTile("wall");
			case SpriteType.Stone:
				return addTile("stone");
			case SpriteType.BoxPlace:
				return addTile("place");
			case SpriteType.Space:
				return addTile("space");
			default:
				return scene.add.sprite(0, 0, "space");
		}
    }

	return defineSystem((world) => {
		const entitiesEntered = spriteQueryEnter(world);

		for (let i = 0; i < entitiesEntered.length; ++i) {
			const id = entitiesEntered[i];
			const sprite = addSprite(Sprite.type[id]);
			spritesById.set(id, sprite);
			sprite.x = GridPosition.x[id] * Options.tile_width;
			sprite.y = GridPosition.y[id] * Options.tile_height;
		}

		const entitiesExited = spriteQueryExit(world);
		for (let i = 0; i < entitiesExited.length; ++i) {
			const id = entitiesEntered[i];
			spritesById.delete(id);
		}

		return world;
	});
}
