import {State,Note} from './type'
export {updateView}
import * as Tone from "tone";
import{attr} from './util.ts'
import {NoteConstant} from "./constants.ts";



const updateView = (
    s: State,
    sample: Readonly<{ [key: string]: Tone.Sampler }>,
): void => {
    const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
        HTMLElement;

    // update the html element text content, given the element id
    const updateTextContent = (id: string) => (content: string) => {
        const element = document.querySelector(id) as HTMLElement;
        element.textContent = content;
    };

    
    const triggerNote = (note: Note) => {
        const { instrumentName, pitch, velocity, start, end } =
            note.instrumentInfo;
        const instrument = sample[instrumentName];
        return note.isTail
            ? instrument.triggerAttack(
                    Tone.Frequency(pitch, "midi").toNote(),
                    undefined,
                    velocity / 127,
                )
            : instrument.triggerAttackRelease(
                    Tone.Frequency(pitch, "midi").toNote(),
                    end - start,
                    undefined,
                    velocity / 127,
                );
    };

    const releaseNote = (note: Note) => {
        sample[note.instrumentInfo.instrumentName].triggerRelease(
            Tone.Frequency(note.instrumentInfo.pitch, "midi").toNote(),
        );
    };


    const createSvgElement = (
        namespace: string | null,
        name: string,
        props: Record<string, string> = {},
    ) => {
        const elem = document.createElementNS(
            namespace,
            name,
        ) as SVGElement;
        Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
        return elem;
    };

    const createAndAppendSvgElement =
        (rootSVG: HTMLElement) =>
        (tag: string, attributes: { [key: string]: string }) => {
            const element = createSvgElement(
                svg.namespaceURI,
                tag,
                attributes,
            );
            rootSVG.appendChild(element);
            return element;
        };

    const createOrGetCircle = (rootSVG: HTMLElement) => (note: Note) => {
        return (
            document.getElementById(note.id) ||
            createAndAppendSvgElement(rootSVG)("circle", {
                r: `${NoteConstant.RADIUS}`,
                cx: `${note.pos.x}%`,
                cy: String(note.pos.y),
                style: "stroke:none;",
                class: "shadow",
                fill: "url(#greenLongGradient)",
                id: note.id,
            })
        );
    };

    const createOrGetRec = (rootSVG: HTMLElement) => (note: Note) => {
        return (
            document.getElementById(`${note.id}Rec`) ||
            createAndAppendSvgElement(rootSVG)("rect", {
                width: String(NoteConstant.TAIL_WIDTH),
                height: String(note.length),
                x: `${note.pos.x - 4}%`,
                y: `-${note.length}`,
                style: "stroke:none;",
                fill: "url(#greenLongGradient)",
                class: "shadow",
                id: `${note.id}Rec`,
            })
        );
    };



    const updateNote = (note: Note) => {
        if (note.isTail) {
            const vRec = createOrGetRec(svg)(note);
            attr(vRec, {
                y: String(note.pos.y - note.length), // - note.length because rectangle offset
                name: "note",
            }); // move the y position
        }
        const view = createOrGetCircle(svg)(note);
        attr(view, { cy: String(note.pos.y), name: "note" });
    };


    updateTextContent("#multiplierText")(String(s.multiplier));
    updateTextContent("#highScoreText")(String(s.currentConsecutive));
    updateTextContent("#scoreText")(String(s.currentScore));
    s.noteToPlay.forEach(triggerNote);
    s.noteToRelease.forEach(releaseNote);
    s.moveLongNote.forEach(updateNote);
    s.allNotes.forEach(updateNote);
    s.exit.forEach((o) => {
        const v = document.getElementById(o.id);
        if (v) svg.removeChild(v);
    });

        s.processesLongNotes.forEach((note) => {
            attr(document.getElementById(note.id), {
                fill: "url(#blackGradient)",
            });
            attr(document.getElementById(`${note.id}Rec`), {
                fill: "url(#blackGradient)",
            });
        });
};