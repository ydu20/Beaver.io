import {keymap, highlightSpecialChars, drawSelection, dropCursor,
} from "@codemirror/view";
import {syntaxHighlighting, bracketMatching,
} from "@codemirror/language";
import {defaultKeymap, history, historyKeymap, indentWithTab} from "@codemirror/commands";
import {highlightSelectionMatches} from "@codemirror/search";
import {closeBrackets, closeBracketsKeymap} from "@codemirror/autocomplete";

import { fontSize } from './EditorTheme';


export const mdEditorExtensions = [
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    bracketMatching(),
    closeBrackets(),
    highlightSelectionMatches(),
    keymap.of([
        indentWithTab, 
        ...defaultKeymap,
        ...historyKeymap,
        ...closeBracketsKeymap,
    ]), 
    fontSize, 
];
