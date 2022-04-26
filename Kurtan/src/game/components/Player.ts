import { defineComponent, Types } from 'bitecs';

export enum PlayerStatus {
    None,

    Idle,

    Rest,

    Idle_L,
    Idle_R,
    Idle_U,
    Idle_D,

    Walk_L,
    Walk_R,
    Walk_U,
    Walk_D,

    Push_L,
    Push_R,
    Push_U,
    Push_D
}

export const Player = defineComponent({
    status: Types.ui8
});

export default Player;
