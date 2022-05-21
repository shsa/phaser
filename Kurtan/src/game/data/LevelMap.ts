import Sprite, { SpriteType } from '@/game/components/Sprite';

class Entity {
	public x!: number;
	public y!: number;
	public type!: SpriteType;
}

export class LevelMap {
	public get width() {
		return 25;
	}

	public get height() {
		return 16;
	}

	private background: Map<number, SpriteType> = new Map();
	private _entities: Map<number, SpriteType> = new Map();
	public entities: Entity[] = new Array();
	private tags: Map<number, number> = new Map();

	public clear() {
		this.background.clear();
		this._entities.clear();
		this.tags.clear();
	}

	public set(col: number, row: number, value: SpriteType) {
		if (col < 0) {
			return;
		}
		if (row < 0) {
			return;
		}
		if (col >= this.width) {
			return;
		}
		if (row >= this.height) {
			return;
		}

		this.background.set(row * this.width + col, value);
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

		const value = this.background.get(row * this.width + col);
		if (value === undefined) {
			return SpriteType.Space;
		}
		return value;
	}

	public setEntity(col: number, row: number, value: SpriteType) {
		this._entities.set(row * this.width + col, value);
		const entity = new Entity();
		entity.x = col;
		entity.y = row;
		entity.type = value;
		this.entities.push(entity);
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

		const value = this._entities.get(row * this.width + col);
		if (value === undefined) {
			return SpriteType.None;
		}
		return value;
	}

	public setTag(col: number, row: number, value: number) {
		this.tags.set(row * this.width + col, value);
	}

	public getTag(col: number, row: number): number {
		return this.tags.get(row * this.width + col) || 0;
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
