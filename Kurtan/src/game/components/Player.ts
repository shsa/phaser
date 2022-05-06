import { defineComponent, Types } from 'bitecs';
import { Direction } from '@/game/components/Input';

export enum PlayerStatus {
    None,

    Start,

    Idle,
    Hidden,

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
    Push_D,

    Walk_U_Stairs_Start0,
    Walk_U_Stairs_Start1,
    Walk_U_Stairs,
    Walk_U_Stairs_End0,
    Walk_U_Stairs_End1,

    Walk_D_Stairs_Start0,
    Walk_D_Stairs_Start1,
    Walk_D_Stairs,
    Walk_D_Stairs_End0,
    Walk_D_Stairs_End1,
    Walk_D_Stairs_End2,

    Applause,
    Smile,
    WithMoney
}

export function getDirection(status: PlayerStatus): Direction {
    switch (status) {
        case PlayerStatus.Walk_L: return Direction.Left;
        case PlayerStatus.Walk_R: return Direction.Right;
        case PlayerStatus.Walk_U: return Direction.Up;
        case PlayerStatus.Walk_D: return Direction.Down;
        default: return Direction.None;
    }
}

export const Player = defineComponent({
    status: Types.ui8,
    duration: Types.f32
});

export default Player;
