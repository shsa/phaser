import {
	defineSystem,
	defineQuery,
	removeEntity
} from 'bitecs';

import Destroy from '@/game/components/Destroy';

export default function createCleanupSystem() {
	const query = defineQuery([Destroy]);

	return defineSystem((world) => {
		query(world).forEach(id => {
			removeEntity(world, id);
		});
	
		return world;
	})
}