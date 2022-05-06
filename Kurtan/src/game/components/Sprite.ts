import { defineComponent, Types } from 'bitecs'

export enum SpriteType {
	None,

	Error,

	Space,
	Stairs,
	Wall,
	Stone,
	BoxPlace,

	BoxNormal,
	BoxPlaced,
	BoxMoney,
	BoxOpen,
	BoxOpened,
	BoxTake,
	BoxEmpty,

	DoorClosed,

	Secret,

	Out
}

export const Sprite = defineComponent({
	type: Types.ui8
})

export default Sprite
