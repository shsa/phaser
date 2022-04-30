import {
	defineComponent,
	addEntity,
	addComponent,
	Types,
	IWorld
} from 'bitecs';

export function nextLevel(world: IWorld, index: number) {
	const id = addEntity(world);
	addComponent(world, Level, id);
	Level.index[id] = index;
}

export const Level = defineComponent({
	index: Types.ui8
});

export default Level;
