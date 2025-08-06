import {Position} from './util'
export {Constants,Viewport,NoteConstant}

const Constants = {
    TICK_RATE_MS: 10,
    SONG_NAME: "RockinRobin",
    PIXEL_PER_TICK: 1.5,
    Y_COORDINATE_BUTTON: 350,
    OVERLAP_THRESEHOLD: 20,
    TAILNOTE_LENGTH_MULTIPLIER : 150,
    COLUMN_X_COORDINATE: [20, 40, 60, 80],
    COLUMN_COLOR: ["green", "red", "blue", "yellow"],
    BUTTON_POSITION: {
        green: new Position(20, 350),
        red: new Position(40, 350),
        blue: new Position(60, 350),
        yellow: new Position(80, 350),
    },
    INITIAL_DELAY : 2000
} as const;


const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 400,
} as const;


const NoteConstant = {
    RADIUS: 0.07 * Viewport.CANVAS_WIDTH,
    TAIL_WIDTH: 15,
};
