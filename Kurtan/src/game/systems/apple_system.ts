import {
	defineSystem,
	defineQuery,
	removeEntity,
	addComponent,
	removeComponent
} from 'bitecs';

import Apple from '@/game/components/Apple';
import Player from '@/game/components/Player';
import Sprite, { SpriteType } from '@/game/components/Sprite';
import Options from '@/game/Options';
import LostApple from '@/game/components/LostApple';
import Touchable from '@/game/components/Touchable';
import Destroy from '@/game/components/Destroy';

export default function createAppleSystem(tweens: Phaser.Tweens.TweenManager) {
	const query = defineQuery([Apple]);
	const queryPlayer = defineQuery([Player]);
	let timeline: Phaser.Tweens.Timeline = tweens.createTimeline();

	const target = {
		i: 0
	};

	return defineSystem((world) => {
		if (!timeline.isPlaying())
		{
			query(world).forEach(id => {
				if (Sprite.type[id] == SpriteType.AppleDestroy)
				{
					timeline.destroy();
					timeline = tweens.timeline();
					timeline.add({
						targets: target,
						i: 0,
						duration: Options.fear_duration,
						onComplete: function () {
							Sprite.type[id] = SpriteType.AppleHidden;
							addComponent(world, Destroy, id);
						}
					});
					timeline.play();
				}
				if (Sprite.type[id] == SpriteType.Apple) {
					timeline.destroy();
					timeline = tweens.timeline();
					timeline.add({
						targets: target,
						i: 0,
						duration: Options.apple_duration,
						onComplete: function () {
							queryPlayer(world).forEach(player => {
								addComponent(world, LostApple, player);
								Sprite.type[id] = SpriteType.AppleDestroy;
								removeComponent(world, Touchable, id);
							});
						}
					});
					timeline.play();
				}
			});
		}
	
		return world;
	})
}