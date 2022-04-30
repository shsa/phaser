import Sprite, { SpriteType } from '@/game/components/Sprite';

export class LevelMap {
	public get width() {
		return 25;
	}

	public get height() {
		return 16;
	}

	private background: SpriteType[] = new Array(this.height * this.width);
	private entities: SpriteType[] = new Array(this.height * this.width);
	private tags: number[] = new Array(this.height * this.width);

	public clear() {
		this.background.fill(SpriteType.Space);
		this.entities.fill(SpriteType.None);
		this.tags.fill(0);
	}

	public set(col: number, row: number, value: SpriteType) {
		this.background[row * this.width + col] = value;
	}

	public get(col: number, row: number): SpriteType {
		if (col < 0) {
			return SpriteType.Out;
		}
		if (row < 0) {
			return SpriteType.Out;
		}
		if (col >= this.width) {
			return SpriteType.Out;
		}
		if (row >= this.height) {
			return SpriteType.Out;
		}

		const value = this.background[row * this.width + col];
		if (value === undefined) {
			return SpriteType.Space;
		}
		return value;
	}

	public setEntity(col: number, row: number, value: SpriteType) {
		this.entities[row * this.width + col] = value;
	}

	public getEntity(col: number, row: number): SpriteType {
		if (col < 0) {
			return SpriteType.None;
		}
		if (row < 0) {
			return SpriteType.None;
		}
		if (col >= this.width) {
			return SpriteType.None;
		}
		if (row >= this.height) {
			return SpriteType.None;
		}

		const value = this.entities[row * this.width + col];
		if (value === undefined) {
			return SpriteType.None;
		}
		return value;
	}

	public setTag(col: number, row: number, value: number) {
		this.tags[row * this.width + col] = value;
	}

	public getTag(col: number, row: number): number {
		return this.tags[row * this.width + col];
	}

	public isWall(col: number, row: number): boolean {
		switch (this.get(col, row)) {
			case SpriteType.Out:
			case SpriteType.Wall:
			case SpriteType.Stone:
				return true;
			default:
				return false;
		}
	}

	public isSpace(col: number, row: number): boolean {
		return !this.isWall(col, row);
	}
}
