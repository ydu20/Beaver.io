import {EditorView, keymap} from "@codemirror/view";
import {EditorState, EditorSelection} from "@codemirror/state";
import {editorExtensions } from "../editor_customizations/EditorExtensions";
import {syntaxTree} from '@codemirror/language';

export default class CodeEditor {

    pythonKeywordsFuncs = new Set([
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
    ]);

    initialEditorContainerStyle = {
        position: 'fixed', 
        transformOrigin: 'top left', 
        zIndex: 2,
        backgroundColor: 'white',
        display: 'none',
    };

    // *****************Keymaps********************
    executeKeymap = {
        key: "Ctrl-Enter",
        mac: "Meta-Enter",
        preventDefault: true,
        run: () => {
            if (this.attachedTile) {
                this.attachedTile.executeCode();
            }
            return true;
        }
    };

    exitKeymap = {
        key: "Escape",
        preventDefault: true,
        run: () => {
            if (this.attachedTile) {
                this.attachedTile.setSelected(1);
                this.mainCanvas.canvas.focus();
                this.mainCanvas.render();
            }
        }
    }

    // *****************Constructor********************
    constructor(codeEditorContainer, mainCanvas) {
        this.codeEditorContainer = codeEditorContainer;
        this.attachedTile = null;
        this.mainCanvas = mainCanvas;

        // Styling
        for (let prop in this.initialEditorContainerStyle) {
            codeEditorContainer.style[prop] = this.initialEditorContainerStyle[prop];
        }

        // EditorChange listener
        this.editorChangeExt = EditorView.updateListener.of(this.onEditorChange);

        // Keymap extensions
        let customKeymaps = [this.executeKeymap, this.exitKeymap];
        this.keymapExt = keymap.of(customKeymaps);

        // Attach codemirror 
        this.editorView = new EditorView({
            extensions: [this.keymapExt, editorExtensions, this.editorChangeExt],
            parent: codeEditorContainer,
        });
    }

    // *****************Drawing Function********************
    draw() {
        let cameraPos = this.mainCanvas.cameraPos;
        if (this.attachedTile) {
            this.codeEditorContainer.style.left = `${this.canvas2viewportX(this.attachedTile.x + this.attachedTile.innerMarginSide, cameraPos)}px`;
            this.codeEditorContainer.style.top = `${this.canvas2viewportY(this.attachedTile.getCodeBlockY(), cameraPos)}px`;
            this.codeEditorContainer.style.width = `${(this.attachedTile.width - this.attachedTile.innerMarginSide * 2)}px`;
            this.codeEditorContainer.style.display = 'block';
            this.codeEditorContainer.style.transform = `scale(${cameraPos.zoom}, ${cameraPos.zoom})`;
            this.editorView.focus();
        }
    }

    // *****************Event Listeners********************

    onEditorChange = (update) => {
        if (this.attachedTile) {
            this.updateTileCode();
        }
        if (update.heightChanged) {
            if (!this.attachedTile) {
                return;
            }
            let newCode = update.state.doc.toString();

            if (update.view.dom.scrollHeight !== 0) {
                this.adjustHeight(update.view.dom.scrollHeight);
            }

            this.updateTileDependencies(update.state, newCode);
        }
    }

    // *****************simulateClick********************

    simulateClick = (x, y) => {
        if (this.attachedTile) {
            let pos = this.editorView.posAtCoords({x, y});
            this.editorView.dispatch({
                selection: EditorSelection.cursor(pos),
            });
        }
    }

    // *****************Adjust Height********************

    adjustHeight = (height) => {
        this.attachedTile.setTileHeight({eh: height});
        this.mainCanvas.render();
    }

    // *****************Toggle coding functions********************

    startCoding(tile) {
        this.attachedTile = tile;

        // Update editorState with Tile's codeState; change Tile Height
        if (tile.codeState == null) {
            let newState = EditorState.create({
                extensions: [this.keymapExt, editorExtensions, this.editorChangeExt]
            });
            this.editorView.setState(newState);
            tile.codeState = newState;
        } else {
            this.editorView.setState(tile.codeState);
        }
    }

    endCoding() {
        this.updateTileCode();
        this.updateTileDependencies(this.editorView.state, this.editorView.state.doc.toString());
        this.attachedTile = null;
        this.codeEditorContainer.style.display = 'none';
        this.mainCanvas.autoSave();
    }

    replaceCode(newCode) {
        if (!this.attachedTile) {
            return;
        }
        let transaction = this.editorView.state.update({
            changes: {from: 0, to: this.editorView.state.doc.length, insert: newCode}
        });
        this.editorView.dispatch(transaction);
    }

    updateTileCode() {

        let lineDivs = Array.from(this.codeEditorContainer.querySelectorAll(".cm-line"));

        let coloredCode = [];

        for (let i = 0; i < lineDivs.length; i++) {
            let line = lineDivs[i];
            let lColoring = [];

            line.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    lColoring.push({
                        text: node.textContent,
                        color: null,
                    });
                } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SPAN") {
                    lColoring.push({
                        text: node.textContent,
                        color: getComputedStyle(node).color,
                    });
                }
            })

            coloredCode.push(lColoring);
        }
        
        // this.attachedTile.code = this.editorView.state.doc.toString();
        this.attachedTile.codeState = this.editorView.state;
        this.attachedTile.coloredCode = coloredCode;
        this.mainCanvas.autoSave();
    }

    // ********************Update tile dependencies***********************

    updateTileDependencies = (state, code) => {
        let cursor = syntaxTree(state).cursor();
        let envStack = [];
        let dependencies = new Set();
        // Push global set
        envStack.push(new Set());

        this.handleTopLevel(cursor, envStack, dependencies, code);

        let independencies = new Set();
        envStack.forEach(v => v.forEach(v2 => independencies.add(v2)));

        let dependenciesOld = this.attachedTile.dependencies;
        let independenciesOld = this.attachedTile.independencies;

        this.attachedTile.dependencies = dependencies;
        this.attachedTile.independencies = independencies;

        // Update flow graph
        // this.mainCanvas.flow.updateEntireGraph();
        this.mainCanvas.flow.updateGraph(
            this.attachedTile,
            dependencies,
            independencies,
            dependenciesOld,
            independenciesOld,
        );
    }

    handleTopLevel = (cursor, envStack, deps, code) => {
        // Go into first level under "Script"
        cursor.firstChild();
        do {
            this.recurseST(cursor, envStack, deps, code);
        } while (cursor.nextSibling());
    }

    // Note: parents handle the return of the pointer back to the parent
    recurseST = (cursor, envStack, deps, code) => {

        let nodeType = cursor.node.type.name
        let nodeStr = code.substring(cursor.from, cursor.to)
        // if (nodeType === 'MemberExpression') {
        //     console.log(cursor.node);
        //     console.log(code.substring(cursor.from, cursor.to))
        //     console.log(cursor.node.firstChild);
        //     console.log(code.substring(cursor.node.firstChild.from, cursor.node.firstChild.to))
        // }

        // console.log(cursor.node);
        // console.log(code.substring(cursor.from, cursor.to));

        // Base case: is a leaf
        if (!cursor.node.firstChild) {
            if (nodeType === 'VariableName') {

                if (!this.varInEnv(nodeStr, envStack)) {
                    deps.add(nodeStr);
                }
            }
        }

        // Recursive case
        if (nodeType === 'AssignStatement') {
            // Remember modified var, then handle rhs first
            cursor.firstChild();
            let modVar = null;
            if (cursor.node.type.name === 'VariableName') {
                modVar = code.substring(cursor.from, cursor.to);
            } else if (cursor.node.type.name === 'MemberExpression') {
                cursor.firstChild();
                modVar = code.substring(cursor.from, cursor.to);
                if (!this.varInEnv(modVar, envStack)) {
                    deps.add(modVar);
                }
                cursor.parent();
            }

            cursor.nextSibling();

            do {
                this.recurseST(cursor, envStack, deps, code);
            } while (cursor.nextSibling());
            
            cursor.parent()

            if (modVar) {
                envStack[envStack.length - 1].add(modVar);
            }
        } else if (['BinaryExpression', 'Body', 'ReturnStatement',
            'CallExpression', 'ExpressionStatement', 'TupleExpression'].includes(nodeType)) {
            // Go down a level and iterate
            cursor.firstChild();
            do {
                this.recurseST(cursor, envStack, deps, code)
            } while (cursor.nextSibling());
            cursor.parent();
        } else if (nodeType === 'FunctionDefinition') {

            // Add function name to environment
            cursor.firstChild();
            cursor.nextSibling();
            if (cursor.node.type.name === 'VariableName') {
                envStack[envStack.length - 1].add(code.substring(cursor.from, cursor.to));
            }
            cursor.parent();

            // Iterate through function
            cursor.firstChild();
            // Push to env stack for new scope
            envStack.push(new Set());
            do {
                this.recurseST(cursor, envStack, deps, code)
            } while(cursor.nextSibling());
            
            // Pop from env stack and return to parent
            envStack.pop()
            cursor.parent()
        } else if (nodeType === 'ParamList') {
            cursor.firstChild()
            do {
                if (cursor.node.type.name === 'VariableName') {
                    if (cursor.node.prevSibling?.type.name == 'AssignOp') {
                        if (!this.varInEnv(code.substring(cursor.from, cursor.to), envStack)) {
                            deps.add(code.substring(cursor.from, cursor.to));
                        }
                    } else {
                        envStack[envStack.length - 1].add(code.substring(cursor.from, cursor.to))
                    }
                }
            } while (cursor.nextSibling());
            cursor.parent();
        } else if (nodeType === 'MemberExpression') {
            // Add object name to dependencies
            cursor.firstChild();
            this.recurseST(cursor, envStack, deps, code);
            cursor.parent();
        } else if (nodeType === 'ArgList') {
            cursor.firstChild();
            do {
                if (cursor.node.type.name == 'VariableName' && cursor.node.nextSibling?.type.name == 'AssignOp') {
                    cursor.nextSibling();
                } else {
                    this.recurseST(cursor, envStack, deps, code);
                }
            } while (cursor.nextSibling());
            cursor.parent();

        }
    }

    varInEnv = (variable, envStack) => {
        for (let env of envStack) {
            if (env.has(variable)) {
                return true;
            }
        }
        return this.pythonKeywordsFuncs.has(variable);
    }


    // ********************Destroy***********************
    destroy() {
        this.editorView.destroy();
    }

    // ********************Converting Coordinates***********************
    canvas2viewportX = (x, cameraPos) => {
        return (x * cameraPos.zoom) + cameraPos.x;
    }

    canvas2viewportY = (y, cameraPos) => {
        return (y * cameraPos.zoom) + cameraPos.y;
    }

}