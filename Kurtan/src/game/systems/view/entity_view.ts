import Phaser from 'phaser';
import {
	defineSystem,
	defineQuery,
	enterQuery,
	exitQuery,
	hasComponent,
	IWorld
} from 'bitecs';

import Entity from '@/game/components/Entity';
import Position from '@/game/components/Position';
import Sprite, { SpriteType } from '@/game/components/Sprite';
import Options from '@/game/Options';
import Visible from '@/game/components/Visible';

export default function createEntityViewSystem(scene: Phaser.Scene) {
	const spritesById = new Map<number, Phaser.GameObjects.Sprite>();

	const spriteQuery = defineQuery([Entity, Position, Sprite]);
	
	const spriteQueryEnter = enterQuery(spriteQuery);
	const spriteQueryExit = exitQuery(spriteQuery);

	function addEntity(key: string, depth: number = 5): Phaser.GameObjects.Sprite {
		const result = scene.add.sprite(0, 0, key);
		result.setDepth(depth);
		return result;
	}

	function addSprite(type: SpriteType): Phaser.GameObjects.Sprite | null {
		switch (type) {
			case SpriteType.BoxPlaced:
			case SpriteType.BoxNormal:
			case SpriteType.BoxMoney:
				return addEntity("box");
			case SpriteType.DoorClosed:
				return addEntity("door");
			case SpriteType.Secret:
				return addEntity("secret");
			case SpriteType.Stairs:
				return addEntity("stairs");
			case SpriteType.AppleHidden:
			case SpriteType.AppleWait:
			case SpriteType.AppleDestroy:
			case SpriteType.Apple:
				return addEntity("apple", 1);
			default:
				return addEntity("error");
		}
    }

	function play(sprite: Phaser.GameObjects.Sprite, name: string, duration: number = 0) {
		if (sprite.anims.getName() !== name || !sprite.anims.isPlaying) {
			sprite.anims.play(name);
			if (duration > 0) {
				let _duration = 0;
				sprite.anims.currentAnim.frames.forEach(function (frame) {
					_duration += frame.duration;
				});
				sprite.anims.timeScale = _duration / duration;
			}
			else {
				sprite.anims.timeScale = 1;
			}
			return;
		}
	}

	function updateEntity(world: IWorld, entity: number) {
		const sprite = spritesById.get(entity);
		if (!sprite) {
			// log an error
			return;
		}

		sprite.x = Options.game_offset_x + Position.x[entity] * Options.tile_width;
		sprite.y = Options.game_offset_y + Position.y[entity] * Options.tile_height;

		switch (Sprite.type[entity]) {
			case SpriteType.BoxNormal:
				return play(sprite, "normal");
			case SpriteType.BoxPlaced:
				return play(sprite, "placed");
			case SpriteType.BoxMoney:
				return play(sprite, "box_money");
			case SpriteType.BoxEmpty:
				return play(sprite, "box_empty");
			case SpriteType.BoxOpen:
				return play(sprite, "box_open", Options.box_open);
			case SpriteType.BoxOpened:
				return play(sprite, "box_opened");
			case SpriteType.BoxTake:
				return play(sprite, "box_take");
			case SpriteType.Apple:
				return play(sprite, "visible");
			case SpriteType.AppleHidden:
			case SpriteType.AppleWait:
				return play(sprite, "hidden");
			case SpriteType.AppleDestroy:
				return play(sprite, "destroy");
		}

		sprite.visible = hasComponent(world, Visible, entity);
    }

	return defineSystem((world) => {
		spriteQueryEnter(world).forEach(id => {
			const sprite = addSprite(Sprite.type[id]);
			if (sprite) {
				spritesById.set(id, sprite);
            }
		});

		spriteQuery(world).forEach(id => {
			updateEntity(world, id);
		})

		spriteQueryExit(world).forEach(id => {
			const sprite = spritesById.get(id);
			sprite?.destroy();
			spritesById.delete(id);
		});

		return world;
	});
}
