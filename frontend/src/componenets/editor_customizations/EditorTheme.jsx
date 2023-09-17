import {EditorView} from "@codemirror/view";

export const fontSize = EditorView.theme({
    "&": {
        fontSize: "14px", 
        border: "none",
    }, 
    ".cm-content": {
        padding: "3px 0 3px 0",
    },
    ".cm-line": {
        lineHeight: '18px',
    },
    "&.cm-editor.cm-focused":{
        outline: "none",
    },
});