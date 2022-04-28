import Phaser from 'phaser';
import {
	defineSystem,
	defineQuery,
	enterQuery,
	hasComponent,
	addComponent,
    IWorld,
	
} from 'bitecs';

import Options from '@/game/Options';
import Player, { PlayerStatus } from '@/game/components/Player';
import Position from '@/game/components/Position';
import Input, { Direction } from '@/game/components/Input';
import PlayDemo from '@/game/components/PlayDemo';
import Level, { LevelStatus } from '@/game/components/Level';

export default function createDemoSystem() {
	const queryLevel = defineQuery([Level]);
	const demoQuery = defineQuery([PlayDemo]);
	const enterDemoQuery = enterQuery(demoQuery);
	const playerQuery = defineQuery([Player, Input]);

	function restartLevel(world: IWorld) {
		const entities = queryLevel(world);
		for (let i = 0; i < entities.length; ++i) {
			const id = entities[i];

			Level.status[id] = LevelStatus.Load;
		}
    }

	return defineSystem((world) => {
		const entities = enterDemoQuery(world);
		for (let i = 0; i < entities.length; ++i)
		{
			const id = entities[i];

			restartLevel(world);
		}
	
		return world;
	})
}