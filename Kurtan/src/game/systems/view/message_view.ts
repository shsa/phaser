import Phaser from 'phaser';
import {
	IWorld,
	defineSystem,
	defineQuery,
	removeComponent,
} from 'bitecs';

import Options from '@/game/Options';
import GameScene from '@/game/scenes/GameScene';
import Message from '@/game/components/Message';
import MessageType, { Messages } from '@/game/data/Messages';

export default function createMessageViewSystem(scene: GameScene) {
	const entityQuery = defineQuery([Message]);
	const lang = "ru-RU";

	return defineSystem((world) => {
		entityQuery(world).forEach(id => {
			const type: MessageType = Message.type[id];
			switch (type) {
				case MessageType.None:
					scene.hideMessage();
					break;
				default:
					{
						const msg = Messages.get(type);
						const text = msg[lang];
						if (text == undefined) {
							scene.showMessage(type.toString());
						}
						else {
							scene.showMessage(text);
						}
						break;
					}
			}
		});

		return world;
	})
}