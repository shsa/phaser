enum MessageType {
    None,
    LostPresent
}

export const Messages: Map<MessageType, any> = new Map();

Messages.set(MessageType.LostPresent, {
    "en-US": "Your prize is gone forever!",
    "ru-RU": "Ваш приз пропал навсегда!"
});

export default MessageType;