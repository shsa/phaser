import Levels from '@/game/data/Levels';

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
			return SpriteType.Wall;
        }
		if (row < 0) {
			return SpriteType.Wall;
		}
		if (col >= this.width) {
			return SpriteType.Wall;
		}
		if (row >= this.height) {
			return SpriteType.Wall;
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

export function getMap(level: any): LevelMap {
    const map = new LevelMap();

	for (let row = 0; row < level.map.length; row++) {
		const line = level.map[row];
		for (let col = 0; col < line.length; col++) {
			switch (Number.parseInt(line[col])) {
				case 1:
					map.set(col, row, SpriteType.Wall);
					break;
				case 0:
					map.set(col, row, SpriteType.Space);
					break;
				case 2:
					map.set(col, row, SpriteType.Place);
					break;
				case 3:
					map.setEntity(col, row, SpriteType.Box);
					break;
				case 5:
					map.setEntity(col, row, SpriteType.Box);
					break;
				default:
					map.set(col, row, SpriteType.Space);
					break;
			}
		}
	}
	
	for (let row = 0; row < map.height; row++) {
		for (let col = 0; col < map.width; col++) {
			if (map.isWall(col, row)) {
				let isStone = true;
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						isStone &&= map.isWall(col + dx, row + dy);
					}
				}
				if (isStone) {
					map.set(col, row, SpriteType.Stone);
                }
            }
        }
    }

    return map;
}

export default getMap;