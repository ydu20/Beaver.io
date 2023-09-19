import {useEffect, useState} from 'react';

import {EditorView, keymap, highlightSpecialChars, drawSelection, dropCursor,
        } from "@codemirror/view";
import {syntaxHighlighting, bracketMatching,
        } from "@codemirror/language";
import {defaultKeymap, history, historyKeymap, indentWithTab} from "@codemirror/commands";
import {highlightSelectionMatches} from "@codemirror/search";
import {closeBrackets, closeBracketsKeymap} from "@codemirror/autocomplete";
import {python} from "@codemirror/lang-python";

import { highlightStyle } from './editor_customizations/EditorHighlightStyle';
import { fontSize } from './editor_customizations/EditorTheme';

import {syntaxTree} from '@codemirror/language';

export default function EditorPortal() {

    const pythonKeywordsFuncs = new Set([
        'False', 'None', 'True', 'and', 'as', 'assert', 'async', 
        'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 
        'else', 'except', 'finally', 'for', 'from', 'global', 'if', 
        'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 
        'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
        'abs', 'dict', 'help', 'min', 'setattr',
        'all', 'dir', 'hex', 'next', 'slice',
        'any', 'divmod', 'id', 'object', 'sorted',
        'ascii', 'enumerate', 'input', 'oct', 'staticmethod',
        'bin', 'eval', 'int', 'open', 'str',
        'bool', 'exec', 'isinstance', 'ord', 'sum',
        'bytearray', 'filter', 'issubclass', 'pow', 'super',
        'bytes', 'float', 'iter', 'print', 'tuple',
        'callable', 'format', 'len', 'property', 'type',
        'chr', 'frozenset', 'list', 'range', 'vars',
        'classmethod', 'getattr', 'locals', 'repr', 'zip',
        'compile', 'globals', 'map', 'reversed', '__import__',
        'complex', 'hasattr', 'max', 'round', 'delattr'
    ])

    const [scale, setScale] = useState(1)

    const [view, setView] = useState(null)

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
            let names = []

            let level = 0

            let code = update.state.doc.toString()

            syntaxTree(update.state).iterate({
                enter: (node) => {
                    console.log(level + ": " + node.name)
                    // if (node.name == 'VariableName') {
                    //     // console.log([node.from, node.to])
                    //     // console.log(update.state.doc.toString())
                    //     // console.log()
                    //     names.push(update.state.doc.toString().substring(node.from, node.to))
                    // }
                    level += 1;
                }, 
                leave: () => {
                    level -= 1;
                }
            })


            // Key: variable name, value: whether this variable's dependencies
            // are self-contained within this cell
            // let defined = {}

            // syntaxTree(update.state).iterate({
            //     enter: (nodeRef) => {
            //         if (nodeRef.name == 'AssignStatement') {
            //             handleAssignment(nodeRef, defined, code, syntaxTree(update.state));
            //         }
            //     }
            // })

            // console.log(defined)

            let cursor = syntaxTree(update.state).cursor()
            let envStack = []
            let dependencies = new Set()

            // Push global set
            envStack.push(new Set())

            handleTopLevel(cursor, envStack, dependencies, code)
            console.log(dependencies)
            
            let updatedVars = new Set()
            envStack.forEach(v => v.forEach(v2 => updatedVars.add(v2)))
            console.log(updatedVars)
        }
    }




    // Note: parents handle the return of the pointer back to the parent
    const recurseST = (cursor, envStack, deps, code) => {
        
        let nodeType = cursor.node.type.name
        let nodeStr = code.substring(cursor.from, cursor.to)
        // console.log([nodeType, nodeStr])

        // Base case: is a leaf
        if (!cursor.node.firstChild) {
            if (nodeType === 'VariableName') {
                if (!varInEnv(nodeStr, envStack)) {
                    deps.add(nodeStr)
                }
            }
        }

        // Recursive case
        if (nodeType === 'AssignStatement') {
            // Remember modified var, then handle rhs first
            cursor.firstChild()
            let modVar = null
            if (cursor.node.type.name === 'VariableName') {
                modVar = code.substring(cursor.from, cursor.to)
            } else if (cursor.node.type.name === 'MemberExpression') {
                cursor.firstChild()
                modVar = code.substring(cursor.from, cursor.to)
                if (!varInEnv(modVar, envStack)) {
                    deps.add(modVar)
                }
                cursor.parent()
            }

            cursor.nextSibling()

            do {
                recurseST(cursor, envStack, deps, code)
            } while (cursor.nextSibling())
            
            cursor.parent()

            if (modVar) {
                
                envStack[envStack.length - 1].add(modVar)
            }
        } else if (['BinaryExpression', 'Body', 'ReturnStatement',
            'CallExpression', 'ExpressionStatement', 'ArgList'].includes(nodeType)) {
            // Go down a level and iterate
            cursor.firstChild()
            do {
                recurseST(cursor, envStack, deps, code)
            } while (cursor.nextSibling())
            cursor.parent()
        } if (nodeType === 'FunctionDefinition') {

            // Add function name to environment
            cursor.firstChild()
            cursor.nextSibling()
            if (cursor.node.type.name === 'VariableName') {
                envStack[envStack.length - 1].add(code.substring(cursor.from, cursor.to))
            }
            cursor.parent()

            // Iterate through function
            cursor.firstChild()
            // Push to env stack for new scope
            envStack.push(new Set())
            do {
                recurseST(cursor, envStack, deps, code)
            } while(cursor.nextSibling())
            
            // Pop from env stack and return to parent
            envStack.pop()
            cursor.parent()
        } if (nodeType === 'ParamList') {
            cursor.firstChild()
            
            do {
                if (cursor.node.type.name === 'VariableName') {
                    envStack[envStack.length - 1].add(code.substring(cursor.from, cursor.to))
                }
            } while (cursor.nextSibling())
            cursor.parent()
        }

    }

    const varInEnv = (variable, envStack) => {
        for (let env of envStack) {
            if (env.has(variable)) {
                return true;
            }
        }

        return pythonKeywordsFuncs.has(variable);
    }

    const handleTopLevel = (cursor, envStack, deps, code) => {
        // Go into first level under "Script"
        cursor.firstChild()
        do {
            recurseST(cursor, envStack, deps, code);
        } while (cursor.nextSibling())
    }


    const handleAssignment = (nodeRef, defined, text, tree) => {
        let target = text.substring(nodeRef.node.firstChild.from, nodeRef.node.firstChild.to)

        if (!(target in defined)) {
            defined[target] = true;
        }
        tree.iterate({
            enter: (nodeRef) => {
                if (nodeRef.name == 'VariableName') {
                    let varName = text.substring(nodeRef.from, nodeRef.to)
                    
                    if (!(varName in defined)) {
                        defined[varName] = false
                    }
                }
            },
            from: nodeRef.from,
            to: nodeRef.to,
        })
    }
    

    useEffect(() => {


        let listenerExt = EditorView.updateListener.of(onChange);

        let view = new EditorView({
            extensions: [editorExtensions, listenerExt],
            parent: document.getElementById('codemirror-editor-container')
        })

        document.body.style.backgroundColor = 'yellow';

        setView(view)
        
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

    const onButtonClick = () => {
        let tr = view.state.update({
            changes: { from: 0, to: view.state.doc.length, insert: "" },
            scrollIntoView: true,
        })
        console.log(tr)
        view.dispatch(tr)
    }


    return (
        <>
            <div id = 'codemirror-editor-container' style = {containerStyle}>
            </div>
            <button
                onClick = {onButtonClick}
                style = {buttonStyle}
            >
                Clear
            </button>
        </>
    )
  
}