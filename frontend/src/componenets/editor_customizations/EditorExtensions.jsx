import {keymap, highlightSpecialChars, drawSelection, dropCursor,
} from "@codemirror/view";
import {syntaxHighlighting, bracketMatching,
} from "@codemirror/language";
import {defaultKeymap, history, historyKeymap, indentWithTab} from "@codemirror/commands";
import {highlightSelectionMatches} from "@codemirror/search";
import {closeBrackets, closeBracketsKeymap} from "@codemirror/autocomplete";
import {python} from "@codemirror/lang-python";

import { highlightStyle } from "./EditorHighlightStyle";
import { fontSize } from './EditorTheme';


export const editorExtensions = [
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    bracketMatching(),
    closeBrackets(),
    highlightSelectionMatches(),
    python(),
    keymap.of([
        indentWithTab, 
        ...defaultKeymap,
        ...historyKeymap,
        ...closeBracketsKeymap,
    ]), 
    fontSize, 
    syntaxHighlighting(highlightStyle),
];
