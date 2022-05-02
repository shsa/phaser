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
import Game from '@/game/components/Game';
import Player, { PlayerStatus } from '@/game/components/Player';
import Input, { Direction } from '@/game/components/Input';
import PlayDemo from '@/game/components/PlayDemo';

export default function createPlayerControllerSystem(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
	const gameQuery = defineQuery([Game])
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
						cursors.space.isDown = false;
						removeComponent(world, PlayDemo, id);
						delayDemo = 10;
					}
				}
			}
			else {
				if (cursors.space.isDown) {
					cursors.space.isDown = false;
					if (delayDemo == 0) {
						gameQuery(world).forEach(game => {
							addComponent(world, PlayDemo, game);
						});
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