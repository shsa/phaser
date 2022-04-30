import { defineComponent, Types } from 'bitecs'

export const Input = defineComponent({
	direction: Types.ui8
})

export enum Direction
{
	None,
	Left,
	Right,
	Up,
	Down
}

class Vector2 {
	public x!: number;
	public y!: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
    }
}

export function getOffset(dir: Direction): any {
	switch (dir) {
		case Direction.Left:
			return new Vector2(-1, 0);
		case Direction.Right:
			return new Vector2(1, 0);
		case Direction.Up:
			return new Vector2(0, -1);
		case Direction.Down:
			return new Vector2(0, 1);
		default:
			return new Vector2(0, 0);
	}
}

export default Input