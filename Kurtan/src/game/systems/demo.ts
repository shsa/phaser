import Phaser from 'phaser';
import {
	defineSystem,
	defineQuery,
	enterQuery,
	exitQuery,
	hasComponent,
	addComponent,
	IWorld,
	Query,
    removeComponent,
	
} from 'bitecs';

import Options from '@/game/Options';
import Player, { PlayerStatus } from '@/game/components/Player';
import GridPosition from '@/game/components/GridPosition';
import Input, { Direction } from '@/game/components/Input';
import PlayDemo from '@/game/components/PlayDemo';
import Level, { LevelStatus } from '@/game/components/Level';
import Levels from '@/game/data/Levels';

class DemoInfo {
	public steps: number[] = [];
	public index: number = 0;
	public x: number = 0;
	public y: number = 0;
}

export default function createDemoSystem(tweens: Phaser.Tweens.TweenManager) {
	const queryLevel = defineQuery([Level]);
	const demoQuery = defineQuery([Player, PlayDemo]);
	const enterDemoQuery = enterQuery(demoQuery);
	const exitDemoQuery = exitQuery(demoQuery);

	const demo = new DemoInfo();

	function restartLevel(world: IWorld): number[] {
		const entities = queryLevel(world);
		for (let i = 0; i < entities.length; ++i) {
			const id = entities[i];

			Level.status[id] = LevelStatus.Load;

			const level = Levels[Level.index[id] - 1];
			return level.demo;
		}
		return [];
    }

	function startDemo(world: IWorld) {
		const entities = enterDemoQuery(world);
		for (let i = 0; i < entities.length; ++i) {
			const player = entities[i];

			demo.steps = restartLevel(world);
			demo.index = 0;
			demo.x = Math.round(GridPosition.x[player]);
			demo.y = Math.round(GridPosition.y[player]);
			tweens.timeScale = 2;
		}
    }

	function endDemo(world: IWorld) {
		const entities = exitDemoQuery(world);
		for (let i = 0; i < entities.length; i++) {
			const player = entities[i];
			removeComponent(world, PlayDemo, player);
			tweens.timeScale = 1;
		}
    }

	function getDirection(index: number): Direction {
		switch (index) {
			case 0:
				return Direction.Left;
			case 1:
				return Direction.Right;
			case 2:
				return Direction.Up;
			case 3:
				return Direction.Down;
			default:
				return Direction.None;
		}
    }

	function getOffset(dir: Direction): any {
		switch (dir) {
			case Direction.Left:
				return {
					x: -1,
					y: 0
				}
			case Direction.Right:
				return {
					x: 1,
					y: 0
				}
			case Direction.Up:
				return {
					x: 0,
					y: -1
				}
			case Direction.Down:
				return {
					x: 0,
					y: 1
				}
			default:
				return {
					x: 0,
					y: 0
				}
        }
    }

	function updateDemo(world: IWorld) {
		const entities = demoQuery(world);
		for (let i = 0; i < entities.length; i++) {
			const player = entities[i];

			if (demo.index < demo.steps.length) {
				const x = Math.round(GridPosition.x[player]);
				const y = Math.round(GridPosition.y[player]);

				if (demo.x == x && demo.y == y) {
					Input.direction[player] = getDirection(demo.steps[demo.index]);
				}
				else {
					demo.index += 1;
					console.log("demo.index:", demo.index);
					const offset = getOffset(getDirection(demo.steps[demo.index]));
					demo.x = offset.x;
					demo.y = offset.y;
				} 
			}
			else {
				removeComponent(world, PlayDemo, player); 
            }
        }
    }

	return defineSystem((world) => {

		endDemo(world);
		startDemo(world);
		updateDemo(world);

		return world;
	})
}