import Phaser from 'phaser';
import {
	defineSystem,
	defineQuery,
	enterQuery,
} from 'bitecs';

import Options from '@/game/Options';
import Player, { PlayerStatus } from '@/game/components/Player';
import Position from '@/game/components/Position';
import Input, { Direction } from '@/game/components/Input';

export default function createPlayerSystem(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
	const playerQuery = defineQuery([Player, Input]);

	return defineSystem((world) => {
		const entities = playerQuery(world);

		for (let i = 0; i < entities.length; ++i)
		{
			const id = entities[i];

			if (cursors.left.isDown) {
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
	
		return world;
	})
}