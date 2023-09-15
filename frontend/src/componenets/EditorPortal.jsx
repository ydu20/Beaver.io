import {useEffect, useState} from 'react';

import {EditorView, keymap, highlightSpecialChars, drawSelection, dropCursor,
        } from "@codemirror/view";
import {syntaxTree, syntaxHighlighting, bracketMatching,
        } from "@codemirror/language";
import {defaultKeymap, history, historyKeymap, indentWithTab} from "@codemirror/commands";
import {highlightSelectionMatches} from "@codemirror/search";
import {closeBrackets, closeBracketsKeymap} from "@codemirror/autocomplete";
import {python} from "@codemirror/lang-python";

import { highlightStyle } from './editor_customizations/EditorHighlightStyle';
import { fontSize } from './editor_customizations/EditorTheme';

import {getStyleTags} from '@lezer/highlight';

export default function EditorPortal() {

    const [scale, setScale] = useState(1);

    const editorExtensions = [
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
    ]

    const onChange = (update) => {
        if (update.heightChanged) {
            // console.log(
            //     update.view.dom.scrollHeight
            // )
            // console.log(update.view)
            // let arr = Array.from(document.querySelectorAll(".cm-line"))
            // arr[0].children.map(c => {
            //     console.log({
            //         oL: c.offsetLeft,
            //         oR: c.offsetRight,
            //         oH: c.offsetHeight,
            //         oW: c.offsetWidth,
            //     })
            // })
            // console.log(arr[0].children)
            // console.log(syntaxTree(update.state));

            // console.log("Printing out nodes...")
            // let tree = syntaxTree(update.state);
            // tree.iterate({
            //     enter: (nodeRef) => {console.log(nodeRef); console.log(getStyleTags(nodeRef))},
            // });
            
            // Colorings: 2D array.
            let colorings = [];
            // let lines = update.state.doc.toString().split('\n');
            let lineDivs = Array.from(document.querySelectorAll(".cm-line"));

            // console.log(lineDivs)

            for (let i = 0; i < lineDivs.length; i++) {
                let line = lineDivs[i]
                let lColoring = []
                let pointer = 0

                // console.log(line.children)
                // console.log(lineText);

                // for (let j = 0; j < line.children.length; j++) {
                //     let c = line.children[j]
                //     // console.log(c)
                //     // console.log(getComputedStyle(c).color)
                    
                //     console.log(c)

                //     if (c.innerText !== '') {
                //         let pos = lineText.indexOf(c.innerText, pointer)
                //         console.log(pos, pointer)
                //         console.log(c.innerText.length)
                //         console.log(c.innerText.length + pos - pointer)
                //         let substring = lineText.substring(pointer, c.innerText.length + pos)
                //         let color = getComputedStyle(c).color
                //         console.log({pos, substring, color})
                //         pointer = pointer + substring.length
                //     }
                // }


                line.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        // console.log("Text:" + node.textContent)
                        // console.log("Text length:" + node.textContent.length)
                        lColoring.push({
                            text: node.textContent,
                            color: null,
                        })
                    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SPAN") {
                        // console.log("Span:", node.textContent);
                        // console.log("Span color:" + getComputedStyle(node).color)
                        lColoring.push({
                            text: node.textContent,
                            color: getComputedStyle(node).color,
                        })
                    }
                })
                console.log(lColoring)
            }
        }
    }

    useEffect(() => {


        let listenerExt = EditorView.updateListener.of(onChange);

        let view = new EditorView({
            extensions: [editorExtensions, listenerExt],
            parent: document.getElementById('codemirror-editor-container')
        })

        document.body.style.backgroundColor = 'yellow';



        // var span = document.createElement('span');
    
        // // Set its text content to a single character
        // span.textContent = '12345';  // You can choose any character

        // // Style it with the desired monospace font and hide it
        // span.style.fontFamily = 'monospace';  // Use the specific font family if not default
        // span.style.position = 'absolute';
        // span.style.fontSize = '14px'
        // span.style.top = '-9999px';
        // document.body.appendChild(span);

        // // Get the width of the character
        // var charWidth = span.offsetWidth;

        // // Clean up: remove the span from the DOM
        // document.body.removeChild(span);
        // console.log(charWidth);
        
        return (() => {
            view.destroy();
        })
    }, [])

    const containerStyle = {
        position: 'fixed',
        top: 100,
        left: 100,
        height: 300,
        width: `${8.6 * 80 + 8}px`,
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