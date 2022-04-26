import Phaser from 'phaser';
import {
	defineSystem,
	defineQuery,
} from 'bitecs';

import Player from '@/game/components/Player';
import Position from '@/game/components/Position';

export default function createCameraSystem(camera: Phaser.Cameras.Scene2D.Camera) {
	const playerQuery = defineQuery([Player, Position]);

	return defineSystem((world) => {
		const entities = playerQuery(world);

		for (let i = 0; i < entities.length; ++i) {
			const id = entities[i];
			const x = Position.x[id];
			const y = Position.y[id];
			//camera.setPosition(x, y);
			camera.setScroll(x - camera.width / 2, y - camera.height / 2);
		}

		return world;
	});
}
