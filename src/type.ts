export type { State, Action, Key,InstrumentData,RNGLazySequence,Note ,ColumnColour};

import { Position } from "./state";


type InstrumentData = Readonly<{
    userPlayed: boolean;
    instrumentName: string;
    velocity: number;
    pitch: number;
    start: number;
    end: number;
    isLastNote : boolean
}>;

type Note = Readonly<{
    pos: Position;
    id: string;
    vel: number;
    isTail: Boolean;
    columnColour: ColumnColour;
    length : number;
    instrumentInfo: InstrumentData;
}>;

type State = Readonly<{
    gameEnd: Boolean;
    objCount: number;
    currentScore: number;
    multiplier: number;
    currentConsecutive: number;
    rngSequence: RNGLazySequence;
    allNotes: ReadonlyArray<Note>;
    exit: ReadonlyArray<Note>;
    noteToPlay: ReadonlyArray<Note>;
    processesLongNotes: ReadonlyArray<Note>;
    noteToRelease: ReadonlyArray<Note>;
    moveLongNote: ReadonlyArray<Note>;
}>;

type RNGLazySequence = () => { value: number; next: RNGLazySequence };

type Key = "KeyH" | "KeyJ" | "KeyK" | "KeyL"

type ColumnColour = "green" | "red" | "blue" | "yellow"


/**
 * Actions modify state
 */
interface Action {
  apply(s: State):State;
}
