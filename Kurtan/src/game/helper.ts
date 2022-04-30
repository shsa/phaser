import { Tweens } from 'phaser';
import { IWorld, Query } from 'bitecs';

function updateTweenData(tweenData: Phaser.Types.Tweens.TweenDataConfig, progress: number) {
	const v = tweenData.ease(progress);
	const current = (tweenData.start ?? 0) + (((tweenData.end ?? 0) - (tweenData.start ?? 0)) * v);
	tweenData.target[tweenData.key] = current;
}

export function nextTween(manager: Phaser.Tweens.TweenManager, tween: Phaser.Tweens.Tween | null, config: Phaser.Types.Tweens.TweenBuilderConfig | object): Phaser.Tweens.Tween {
	if (tween) {
		const progress = tween.elapsed / tween.duration;
		for (let i = 0; i < tween.totalData; i++) {
			updateTweenData(tween.data[i], progress);
		}
		tween.remove();
		const newTween = manager.add(config);
		newTween.duration -= (tween.elapsed - tween.duration);

		//const delta = tween.elapsed - tween.duration;
		//const newTween = manager.add(config);
		//newTween.play();
		//newTween.update(0, delta);

		return newTween;
	}
	else {
		return manager.add(config);
    }
}

export function first(world: IWorld, query: Query): number | undefined {
	const entities = query(world);
	if (entities.length > 0) {
		return entities[0];
	}
	return undefined;
}
