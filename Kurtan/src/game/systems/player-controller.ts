import Phaser from 'phaser';
import {
	defineSystem,
	defineQuery,
	enterQuery,
	hasComponent,
	addComponent,
	removeComponent
} from 'bitecs';

import Options from '@/game/Options';
import Player, { PlayerStatus } from '@/game/components/Player';
import Position from '@/game/components/Position';
import Input, { Direction } from '@/game/components/Input';
import PlayDemo from '@/game/components/PlayDemo';

export default function createPlayerControllerSystem(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
	const playerQuery = defineQuery([Player, Input]);
	let delayDemo = 0;
	return defineSystem((world) => {
		const entities = playerQuery(world);

		for (let i = 0; i < entities.length; ++i)
		{
			const id = entities[i];

			delayDemo = Math.max(0, delayDemo - 1);
			if (hasComponent(world, PlayDemo, id)) {
				if (delayDemo == 0) {
					if (cursors.space.isDown) {
						removeComponent(world, PlayDemo, id);
						delayDemo = 10;
					}
				}
			}
			else {
				if (cursors.space.isDown) {
					if (delayDemo == 0) {
						addComponent(world, PlayDemo, id);
						delayDemo = 10;
					}
				}
				else if (cursors.left.isDown) {
					Input.direction[id] = Direction.Left;
				}
				else if (cursors.right.isDown) {
					Input.direction[id] = Direction.Right;
				}
				else if (cursors.up.isDown) {
					Input.direction[id] = Direction.Up;
				}
				else if (cursors.down.isDown) {
					Input.direction[id] = Direction.Down;
				}
				else {
					Input.direction[id] = Direction.None;
				}
            }
		}
	
		return world;
	})
}