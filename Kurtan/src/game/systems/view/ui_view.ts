import Phaser from 'phaser';
import {
	defineSystem,
	defineQuery,
	enterQuery,
	exitQuery,
} from 'bitecs';

import Options from '@/game/Options';
import Player from '@/game/components/Player';
import Level from '@/game/components/Level';

export default function createUiViewSystem(scene: Phaser.Scene) {
	const playerQuery = defineQuery([Player, Level]);

	return defineSystem((world) => {
		playerQuery(world).forEach(player => {
		});

		return world;
	});
}
