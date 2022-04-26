import { defineComponent, Types } from 'bitecs'

export enum SpriteType {
	None,

	Space,
	Wall,
	Stone,
	Place,
	Box,
	BoxPlaced
}

export const Sprite = defineComponent({
	type: Types.ui8
})

export default Sprite
