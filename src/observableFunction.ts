import {
    fromEvent,
    from,
    of,
    take,
    Observable
} from "rxjs";

import {
    map,
    filter,
    mergeMap,
    delay,
    startWith,
} from "rxjs/operators";

import {
    InstrumentData,
    Key,
    ColumnColour,
} from "./type.ts";


import{
  KeyUpAction,
  Press
} from './state.ts'

export {
  arrayToInstrumentData,
  note,
  mergeKeyUpDown
}



const arrayToInstrumentData = (...n: string[]): InstrumentData => {
    return {
        userPlayed: n[0] === "True",
        instrumentName: n[1],
        velocity: parseInt(n[2], 10),
        pitch: parseInt(n[3], 10),
        start: parseFloat(n[4]),
        end: parseFloat(n[5]),
        isLastNote: n[6] === "True",
    } as const;
};

const note = (noteArray: Array<string[]>): Observable<InstrumentData> => {
    return from(noteArray).pipe(
        mergeMap((n: string[]) =>
            of(n).pipe(
                map((n: string[]) => arrayToInstrumentData(...n)),
                delay(parseFloat(n[4]) * 1000),
            ),
        ),
    );
};


const mergeKeyUpDown = <T>(k: Key, colour: ColumnColour) => {
    return fromEvent<KeyboardEvent>(document, "keydown").pipe(
        filter(({ code }) => code === k),
        filter(({ repeat }) => !repeat),
        mergeMap(() =>
            fromEvent<KeyboardEvent>(document, "keyup").pipe(
                filter(({ code }) => code === k),
                map(() => new KeyUpAction(colour)),
                take(1),
                startWith(new Press(colour)),
            ),
        ),
    );
};
