import { defineComponent, Types } from 'bitecs';

export enum LevelStatus {
	None,
	Load
}

export const Level = defineComponent({
	index: Types.ui8,
	status: Types.ui8
});

export default Level;
