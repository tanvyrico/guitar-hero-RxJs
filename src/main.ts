/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */
// export{createSvgElement,Note}


import "./style.css";
import {
    State,
    Action,
} from "./type.ts";
import { updateView } from "./updateView.ts";

import {
    note,
    mergeKeyUpDown
} from './observableFunction.ts'


import { Constants,Viewport } from "./constants.ts";


import { Tick, PlayMusic, KeyUpAction,Ending,SpawnNote,Press,initialState} from "./state.ts"
import { fromEvent, interval, merge , from, of,timer,take,switchMap} from "rxjs";
import { map, filter, scan, mergeMap, delay, concatMap,startWith, finalize } from "rxjs/operators";
import * as Tone from "tone";
import { SampleLibrary } from "./tonejs-instruments";


/** Constants */


/** Rendering (side effects) */

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
    elem.setAttribute("visibility", "visible");
    elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
    elem.setAttribute("visibility", "hidden");

function csvParser(csvContents: string) {
    return csvContents
        .trim()
        .split("\n")
        .slice(1)
        .map((line) => [line])
        .map((entry) => entry[0].split(",").concat(["False"]));
}

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main(csvContents: string, samples: { [key: string]: Tone.Sampler }) {
    const parseNote = csvParser(csvContents);

    // Add a dummy note at the end to ensure that the final note of the song is fully played before the game ends
    const parseNoteWithEnding = parseNote.concat([
        [
            "False",
            "violin",
            "0",
            "0",
            parseInt(parseNote[parseNote.length - 1][4]) + 5 + "",
            parseInt(parseNote[parseNote.length - 1][4]) + 6 + "",
            "True",
        ],
    ]);

    // Canvas elements
    const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
        HTMLElement;

    const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
        HTMLElement;


    svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
    svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);

    // An observable that will emit each note based on its start time (s) specified in the CSV
    const note$ = note(parseNoteWithEnding);


    // Map notes intended for immediate playback to the PlayMusic action.
    // Delay the first emission to ensure the music starts only when the first note the user needs to play reaches the bottom
    const backgroundNote$ = timer(Constants.INITIAL_DELAY).pipe(
        concatMap(() =>
            note$.pipe(
                filter((n) => !n.userPlayed),
                map((n) => {
                    return new PlayMusic(n);
                }),
            ),
        ),
    );

    const endingNote$ = note$.pipe(
        filter((n) => n.isLastNote),
        map((_) => new Ending()),
    );

    // Map the notes intended for user play to the SpawnNote action.
    const playNote$ = note$.pipe(
        filter((n) => n.userPlayed),
        map((n) => new SpawnNote(n)),
    );

    // Observable for user input, specifying the key to listen for and the corresponding color/column
    const hKeyUpDown$ = mergeKeyUpDown("KeyH", "green");
    const jKeyUpDown$ = mergeKeyUpDown("KeyJ", "red");
    const kKeyUpDown$ = mergeKeyUpDown("KeyK", "blue");
    const lKeyUpDown$ = mergeKeyUpDown("KeyL", "yellow");

    const reduceState = (s: State, action: Action) => action.apply(s);

    const tick$ = interval(Constants.TICK_RATE_MS).pipe(
        map((elapsed) => new Tick()),
    );

    const mainStream = merge(
        endingNote$,
        tick$,
        playNote$,
        hKeyUpDown$,
        jKeyUpDown$,
        kKeyUpDown$,
        lKeyUpDown$,
        backgroundNote$,
    ).pipe(scan((s: State, a: Action) => reduceState(s, a), initialState));

    const enterKey$ = fromEvent<KeyboardEvent>(document, "keydown").pipe(
        filter((event) => event.key === "Enter"),
    );

    // main pipe of the game
    const gameStream$ = enterKey$
        .pipe(
            startWith(null),
            switchMap(() => mainStream), // switchMap to reset the mainStream observable when the enterKey$ emit value
        )
        .subscribe((s: State) => {
            if (s.objCount === 0)
                svg.querySelectorAll("[name=note]").forEach((x) => x.remove());
            updateView(s, samples);
            s.gameEnd ? show(gameover) : hide(gameover);
        });
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
// You should not need to change this, beware if you are.
if (typeof window !== "undefined") {
//     // Load in the instruments and then start your game!
    const samples = SampleLibrary.load({
        instruments: [
            "bass-electric",
            "violin",
            "piano",
            "trumpet",
            "saxophone",
            "trombone",
            "flute",
        ], // SampleLibrary.list,
        baseUrl: "samples/",
    });

    const startGame = (contents: string) => {
        document.body.addEventListener(
            "mousedown",
            function () {
                main(contents, samples);
            },
            { once: true },
        );
    };

    const { protocol, hostname, port } = new URL(import.meta.url);
    const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ""}`;

    Tone.ToneAudioBuffer.loaded().then(() => {
        for (const instrument in samples) {
            samples[instrument].toDestination();
            samples[instrument].release = 0.5;
        }

        fetch(`${baseUrl}/assets/${Constants.SONG_NAME}.csv`)
            .then((response) => response.text())
            .then((text) => startGame(text))
            .catch((error) =>
                console.error("Error fetching the CSV file:", error),
            );
        
    });
}

