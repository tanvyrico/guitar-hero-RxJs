export {
    Position,
    Tick,
    PlayMusic,
    KeyUpAction,
    Ending,
    SpawnNote,
    Press,
    initialState,
};

import { except, Position, RNGlazySequence } from "./util";

import { State, Action, InstrumentData, Note, ColumnColour } from "./type";

import { Constants } from "./constants.ts";

const initialState: State = {
    gameEnd: false,
    objCount: 0,
    currentScore: 0,
    multiplier: 1,
    currentConsecutive: 0,
    allNotes: [],
    exit: [],
    noteToPlay: [],
    processesLongNotes: [],
    noteToRelease: [],
    moveLongNote: [],
    rngSequence: RNGlazySequence(1),
} as const;

class PlayMusic implements Action {
    constructor(public readonly note: InstrumentData) {}
    apply(s: State): State {
        return {
            ...s,
            // add note to be play in the updateView
            noteToPlay: [
                <Note>{
                    instrumentInfo: this.note,
                    id: "-",
                    pos: new Position(0, 0),
                    isTail: false,
                    vel: 100,
                    columnColour: "green",
                    length: 0,
                },
            ],
        };
    }
}

class Press implements Action {
    constructor(public readonly pressedButton: ColumnColour) {}

    apply(s: State): State {
        const buttonPosition = Constants.BUTTON_POSITION[this.pressedButton];

        // Curried function to check if two Position objects overlap.
        // The threshold defines the maximum/minimum allowed vertical difference for considering an overlap.
        const overlapY =
            (threshold: number) => (first: Position) => (second: Position) =>
                first.x === second.x &&
                Math.abs(first.y - second.y) <= threshold;

        // defining the threshold
        const overlapYThresehold = overlapY(Constants.OVERLAP_THRESEHOLD);

        // pass in the first position that will be check against
        const isNoteOverlapButton = overlapYThresehold(buttonPosition);

        const overlapNote = s.allNotes.filter((n) =>
            isNoteOverlapButton(n.pos),
        );

        const overlapTailNote = overlapNote.filter((n) => n.isTail);
        const overlapNormalNote = overlapNote.filter((n) => !n.isTail);

        const noteToPlay =
            overlapNote.length >= 1
                ? overlapNote
                : [
                      <Note>{
                          instrumentInfo: {
                              userPlayed: false,
                              instrumentName: "violin",
                              velocity: 100,
                              pitch: 113,
                              start: 0,
                              end: s.rngSequence().value,
                              isLastNote: false,
                          },
                          id: "-",
                          pos: new Position(0, 0),
                          isTail: false,
                          vel: 100,
                          columnColour: "green",
                          length: 0,
                      },
                  ]; // if user Press a key but no note is overlap, create a random note to be played

        return {
            ...s,
            currentConsecutive: s.currentConsecutive + overlapNormalNote.length,
            currentScore:
                s.currentScore + overlapNormalNote.length * s.multiplier,
            processesLongNotes: s.processesLongNotes.concat(overlapTailNote), // add tail note that is pressed to the processLongNotes
            exit: [...s.exit, ...overlapNormalNote],
            allNotes: except(s.allNotes)(overlapNote),
            noteToPlay,
            rngSequence:
                overlapNote.length >= 1 ? s.rngSequence : s.rngSequence().next, // if there is overlap, generate the next sequence
        };
    }
}

class Ending implements Action {
    apply(s: State): State {
        return {
            ...s,
            gameEnd: true,
        };
    }
}

class Tick implements Action {
    constructor() {}
    apply(s: State): State {
        const missedNote = s.allNotes.filter(Tick.noteMissed);
        const currentConsecutive =
            missedNote.length >= 1 ? 0 : s.currentConsecutive;
        return {
            ...s,
            allNotes: except(s.allNotes.map(Tick.moveNote))([...missedNote]), // Exclude missed notes to avoid counting them again as missed in the next tick
            exit: s.exit.concat(missedNote.filter((n) => !n.isTail)), // need to filter to ensure tail note is doesn't pass in to the exit array (because tail note still need to be animated)
            noteToPlay: [],
            moveLongNote: s.moveLongNote.map(Tick.moveNote),
            processesLongNotes: s.processesLongNotes.map(Tick.moveNote),
            currentConsecutive:
                missedNote.length >= 1 ? 0 : s.currentConsecutive,
            multiplier: 1 + 0.2 * Math.floor(currentConsecutive / 10),
        };
    }

    static noteMissed = (note: Note): boolean =>
        note.pos.y >
        Constants.Y_COORDINATE_BUTTON + Constants.OVERLAP_THRESEHOLD;

    static moveNote = (note: Note): Note => ({
        ...note,
        pos: note.pos.move(0, note.vel),
    });
}

class SpawnNote implements Action {
    constructor(public readonly note: InstrumentData) {}
    apply(s: State): State {
        const createNewNote =
            (instrumentInfo: InstrumentData) =>
            (id: string): Note => ({
                id,
                instrumentInfo,
                isTail: SpawnNote.isTailNote(instrumentInfo),
                pos: new Position(SpawnNote.getXCoordinate(instrumentInfo), 0),
                length:
                    (instrumentInfo.end - instrumentInfo.start) *
                    Constants.TAILNOTE_LENGTH_MULTIPLIER,
                columnColour: SpawnNote.getNoteColour(instrumentInfo),
                vel: Constants.PIXEL_PER_TICK,
            });

        const newNote = createNewNote(this.note)(String(s.objCount));
        return <State>{
            ...s,
            allNotes: s.allNotes.concat([newNote]),
            moveLongNote: s.moveLongNote.concat([newNote]),
            objCount: s.objCount + 1,
        };
    }

    static isTailNote = (note: InstrumentData): boolean =>
        note.end - note.start >= 1;

    static getNoteColour = (note: InstrumentData): ColumnColour => {
        return Constants.COLUMN_COLOR[note.pitch % 4];
    };

    static getXCoordinate = (note: InstrumentData): number =>
        Constants.COLUMN_X_COORDINATE[note.pitch % 4];
}

class KeyUpAction implements Action {
    constructor(
        public readonly columnColour: "green" | "red" | "blue" | "yellow",
    ) {}
    apply(s: State): State {
        // Retrieve the long note in process located in the column where the KeyUp event occurred
        const keyUpNotes = s.processesLongNotes.filter(
            (n) => n.columnColour === this.columnColour,
        );

        const correctlyPress = keyUpNotes.filter(KeyUpAction.fullyPress);

        return keyUpNotes.length >= 1
            ? <State>{
                  ...s,
                  noteToRelease: [...keyUpNotes],
                  currentConsecutive:
                      correctlyPress.length >= 1
                          ? s.currentConsecutive + correctlyPress.length
                          : 0,
                  currentScore: s.currentScore + correctlyPress.length * 5,
                  processesLongNotes: except(s.processesLongNotes)(keyUpNotes),
              }
            : <State>{
                  ...s,
              }; // if no long note in-process for that column, just return the state directly
    }

    // Check if the tail note is pressed for at least the entire duration of the tail
    static fullyPress = (note: Note): boolean =>
        note.pos.y >= Constants.Y_COORDINATE_BUTTON + note.length;
}
