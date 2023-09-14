import {useEffect, useState} from 'react';

import {EditorView, keymap, highlightSpecialChars, drawSelection, dropCursor,
        } from "@codemirror/view";
import {defaultHighlightStyle, syntaxHighlighting, bracketMatching,
        } from "@codemirror/language";
import {defaultKeymap, history, historyKeymap, indentWithTab} from "@codemirror/commands";
import {highlightSelectionMatches} from "@codemirror/search";
import {closeBrackets, closeBracketsKeymap} from "@codemirror/autocomplete";
import {python} from "@codemirror/lang-python";
import {oneDark} from "@codemirror/theme-one-dark";


import { highlightStyle } from './editor_customizations/EditorHighlightStyle';
import { fontSize } from './editor_customizations/EditorTheme';

export default function EditorPortal() {

    const [scale, setScale] = useState(1);


    const editorExtensions = [
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        // syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
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
    ]

    useEffect(() => {

        let view = new EditorView({
            extensions: [editorExtensions],
            parent: document.getElementById('codemirror-editor-container')
        })

        document.body.style.backgroundColor = 'yellow';
        
        return (() => {
            view.destroy();
        })
    }, [])

    const containerStyle = {
        position: 'fixed',
        top: 100,
        left: 100,
        height: 300,
        width: 500,
        border: '1px solid black',
        backgroundColor: 'white',
        transformOrigin: 'top left',
        transform: `scale(${scale}, ${scale})`,
    }

    const buttonStyle = {
        position: 'fixed',
        bottom: 50,
        left: 100,
    }


    return (
        <>
            <div id = 'codemirror-editor-container' style = {containerStyle}>
            </div>
            <button
                onClick = {() => {setScale(prev => prev * 1.3)}}
                style = {buttonStyle}
            >
                Enlarge
            </button>
        </>
    )
  
}