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
import Input, { Direction, getOffset } from '@/game/components/Input';
import PlayDemo from '@/game/components/PlayDemo';
import Level from '@/game/components/Level';
import Levels from '@/game/data/Levels';

class DemoInfo {
	public steps: number[] = [];
	public index: number = 0;
	public x: number = 0;
	public y: number = 0;
	public dir: Direction = Direction.None;
}

export default function createDemoSystem(tweens: Phaser.Tweens.TweenManager, anims: Phaser.Animations.AnimationManager) {
	const demoQuery = defineQuery([Player, Level, PlayDemo]);
	const enterDemoQuery = enterQuery(demoQuery);
	const exitDemoQuery = exitQuery(demoQuery);

	const demo = new DemoInfo();

	function getSteps(world: IWorld): number[] {
		const entities = demoQuery(world);
		for (let i = 0; i < entities.length; ++i) {
			const id = entities[i];

			const level = Levels[Level.index[id] - 1];
			return level.demo;
		}
		return [];
    }

	function startDemo(world: IWorld) {
		enterDemoQuery(world).forEach(player => {
			demo.steps = getSteps(world);
			demo.index = 0;
			demo.dir = getDirection(demo.steps[demo.index]);
			const offset = getOffset(demo.dir);
			demo.x = Math.round(GridPosition.x[player]) + offset.x;
			demo.y = Math.round(GridPosition.y[player]) + offset.y;
			Input.direction[player] = demo.dir;

			tweens.timeScale = 4;
			anims.globalTimeScale = 4;
        })
    }

	function endDemo(world: IWorld) {
		const entities = exitDemoQuery(world);
		for (let i = 0; i < entities.length; i++) {
			const player = entities[i];
			removeComponent(world, PlayDemo, player);

			tweens.timeScale = 1;
			anims.globalTimeScale = 1;
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

	function updateDemo(world: IWorld) {
		const entities = demoQuery(world);
		for (let i = 0; i < entities.length; i++) {
			const player = entities[i];

			if (demo.index < demo.steps.length) {
				const x = Math.round(GridPosition.x[player]);
				const y = Math.round(GridPosition.y[player]);
				//const x = GridPosition.x[player];
				//const y = GridPosition.y[player];

				if (demo.x == x && demo.y == y) {
					demo.index += 1;
					demo.dir = getDirection(demo.steps[demo.index]);
					console.log("demo.index:", demo.index);
					const offset = getOffset(demo.dir);
					demo.x = x + offset.x;
					demo.y = y + offset.y;
					Input.direction[player] = demo.dir;
				}
				else {
					Input.direction[player] = demo.dir;
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