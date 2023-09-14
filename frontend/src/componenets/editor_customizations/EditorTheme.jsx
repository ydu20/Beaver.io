import {EditorView} from "@codemirror/view";

export const fontSize = EditorView.theme({
    "&": {
        fontSize: "14px", 
    }, 
    '.cm-content': {
        padding: '3px 0 3px 0',
    }
});