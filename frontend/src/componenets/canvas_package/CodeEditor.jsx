import {EditorView} from "@codemirror/view";
import { editorExtensions } from "../editor_customizations/EditorExtensions";

export default class CodeEditor {

    initialEditorContainerStyle = {
        position: 'fixed', 
        transformOrigin: 'top left', 
        zIndex: 2,
        backgroundColor: 'white',
        display: 'none',
    }

    constructor(editorContainer, mainCanvas) {
        this.editorContainer = editorContainer;
        this.attachedTile = null;
        this.mainCanvas = mainCanvas;

        // Styling
        for (let prop in this.initialEditorContainerStyle) {
            editorContainer.style[prop] = this.initialEditorContainerStyle[prop];
        }

        // EditorChange listener
        let editorChangeExt = EditorView.updateListener.of(this.onEditorChange);

        // Attach codemirror 
        this.editorView = new EditorView({
            extensions: [editorExtensions, editorChangeExt],
            parent: editorContainer,
        })
    }

    // *****************Drawing Function********************
    draw() {
        let cameraPos = this.mainCanvas.cameraPos;
        if (this.attachedTile) {
            this.editorContainer.style.left = `${this.canvas2viewportX(this.attachedTile.x + this.attachedTile.innerMarginSide, cameraPos)}px`;
            this.editorContainer.style.top = `${this.canvas2viewportY(this.attachedTile.y + this.attachedTile.innerMarginTop, cameraPos)}px`;
            this.editorContainer.style.width = `${(this.attachedTile.width - this.attachedTile.innerMarginSide * 2)}px`;
            this.editorContainer.style.display = 'block';
            this.editorContainer.style.transform = `scale(${cameraPos.zoom}, ${cameraPos.zoom})`;
            this.editorView.focus();
        }
    }

    // *****************Event Listeners********************

    // onInput(e) {
    //     this.editor.value = e.target.value;
    //     this.attachedTile.code = e.target.value;
    //     this.adjustHeight();
    // }

    // onKeyDown(e) {
    //     if (e.key === 'Tab') {
    //         e.preventDefault();
    //         this.insertTab();
    //     }
    // }

    // *****************Special Adjustments********************
    // insertTab() {
    //     let cursorPos = this.editor.selectionStart;
    //     let beforeCursor = this.editor.value.slice(0, cursorPos);
    //     let afterCursor = this.editor.value.slice(cursorPos);

    //     let tabChar = '\t';
    //     this.editor.value = beforeCursor + tabChar + afterCursor;

    //     setTimeout(() => {
    //         this.editor.selectionStart = cursorPos + tabChar.length;
    //         this.editor.selectionEnd = cursorPos + tabChar.length;
    //     });
    // }

    onEditorChange = (update) => {
        if (update.heightChanged) {
            this.adjustHeight(update.view.dom.scrollHeight);
        }
    }

    adjustHeight = (height) => {
        this.attachedTile.setTileHeight(height, null)
        this.mainCanvas.render()
    }

    // *****************Toggle coding functions********************

    startCoding(tile) {
        this.attachedTile = tile

        // Update editorState with Tile's code, editorView with Tile's height
        let tr = this.editorView.state.update({
            changes: {from: 0, to: this.editorView.state.doc.length, insert: tile.code}, 
            scrollIntoView: true,
        })
        this.editorView.dispatch(tr)
    }

    endCoding() {
        this.updateTileCode()
        this.attachedTile = null
        this.editorContainer.style.display = 'none'
    }

    updateTileCode() {
        let lineDivs = Array.from(document.querySelectorAll(".cm-line"));

        let coloredCode = []

        for (let i = 0; i < lineDivs.length; i++) {
            let line = lineDivs[i]
            let lColoring = []

            line.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    lColoring.push({
                        text: node.textContent,
                        color: null,
                    })
                } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SPAN") {
                    lColoring.push({
                        text: node.textContent,
                        color: getComputedStyle(node).color,
                    })
                }
            })

            coloredCode.push(lColoring)
        }
        
        this.attachedTile.code = this.editorView.state.doc.toString()
        this.attachedTile.coloredCode = coloredCode
    }

    // ********************Destroy***********************
    destroy() {
        this.editorView.destroy();
    }

    // ********************Converting Coordinates***********************
    canvas2viewportX(x, cameraPos) {
        return (x * cameraPos.zoom) + cameraPos.x;
    }

    canvas2viewportY(y, cameraPos) {
        return (y * cameraPos.zoom) + cameraPos.y;
    }

}