import { defineComponent, Types } from 'bitecs'

export enum SpriteType {
	None,

	Error,

	Space,
	Stairs,
	Wall,
	Stone,
	BoxPlace,

	BackgroundUI,

	BoxNormal,
	BoxPlaced,
	BoxMoney,
	BoxOpen,
	BoxOpened,
	BoxTake,
	BoxEmpty,

	DoorClosed,

	AppleHidden,
	AppleWait,
	Apple,
	AppleDestroy,

	Secret,

	Out
}

export const Sprite = defineComponent({
	type: Types.ui8
})

export default Sprite
