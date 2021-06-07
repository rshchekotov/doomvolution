export interface Duck {
    name: string;
    birthday: Date;
    owner: string;
    state: number;
    kind: number;

    nextStageAt: Date;

    lastFed: Date;
    lastPlayed: Date;
    consective: number;

    value: number;
}