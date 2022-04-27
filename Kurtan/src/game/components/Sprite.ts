import { defineComponent, Types } from 'bitecs'

export enum SpriteType {
	None,

	Space,
	Wall,
	Stone,
	BoxPlace,
	BoxNormal,
	BoxPlaced,
	BoxMoney,
}

export const Sprite = defineComponent({
	type: Types.ui8
})

export default Sprite
