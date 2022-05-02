import Phaser from 'phaser';
import {
	defineSystem,
	defineQuery,
	enterQuery,
	exitQuery,
} from 'bitecs';

import Tile from '@/game/components/Tile';
import Position from '@/game/components/Position';
import Sprite, { SpriteType } from '@/game/components/Sprite';
import Destroy from '@/game/components/Destroy';
import Options from '@/game/Options';

export default function createTileViewSystem(scene: Phaser.Scene) {
	const spritesById = new Map<number, Phaser.GameObjects.Sprite>();

	const spriteQuery = defineQuery([Tile, Position, Sprite]);
	const destroyQuery = defineQuery([Tile, Destroy, Sprite])
	
	const spriteQueryEnter = enterQuery(spriteQuery);

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
			case SpriteType.Error:
				return addTile("error");
			default:
				return scene.add.sprite(0, 0, "space");
		}
    }

	return defineSystem((world) => {
		spriteQueryEnter(world).forEach(id => {
			const sprite = addSprite(Sprite.type[id]);
			spritesById.set(id, sprite);
			sprite.x = Options.game_offset_x + Position.x[id] * Options.tile_width;
			sprite.y = Options.game_offset_y + Position.y[id] * Options.tile_height;
        })

		destroyQuery(world).forEach(id => {
			const sprite = spritesById.get(id);
			sprite?.destroy();
			spritesById.delete(id);
		});

		return world;
	});
}
