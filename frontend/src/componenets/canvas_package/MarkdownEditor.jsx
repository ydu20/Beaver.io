import {EditorView} from "@codemirror/view";
import {EditorState} from "@codemirror/state";

import { mdEditorExtensions } from "../editor_customizations/MDEditorExtensions";

export default class MarkdownEditor {

    initialEditorContainerStyle = {
        position: 'fixed', 
        transformOrigin: 'top left', 
        zIndex: 2,
        backgroundColor: 'white',
        display: 'none',
    };

    constructor(mdEditorContainer, mainCanvas) {
        this.mdEditorContainer = mdEditorContainer;
        this.attachedTile = null;
        this.mainCanvas = mainCanvas;

        // Styling
        for (let prop in this.initialEditorContainerStyle) {
            mdEditorContainer.style[prop] = this.initialEditorContainerStyle[prop];
        }

        // EditorChange listener
        this.editorChangeExt = EditorView.updateListener.of(this.onEditorChange);

        // Attach codemirror
        this.editorView = new EditorView({
            parent: mdEditorContainer,
        });
    }

    // *****************Event Listeners********************

    onEditorChange = (update) => {
        if (this.attachedTile) {
            this.updateTileMarkdown();
        }
        if (update.heightChanged) {
            if (!this.attachedTile) {
                return;
            }
            if (update.view.dom.scrollHeight !== 0) {
                this.adjustHeight(update.view.dom.scrollHeight);
            }
        }
    }

    // *****************Adjust Height********************

    adjustHeight = (height) => {
        this.attachedTile.setTileHeight({mh: height});
        this.mainCanvas.render();
    }


    draw() {
        let cameraPos = this.mainCanvas.cameraPos;
        // console.log("HERE");
        if (this.attachedTile) {
            this.mdEditorContainer.style.left = `${this.canvas2viewportX(this.attachedTile.x + this.attachedTile.innerMarginSide, cameraPos)}px`;
            this.mdEditorContainer.style.top = `${this.canvas2viewportY(this.attachedTile.y + this.attachedTile.innerMarginTop, cameraPos)}px`;
            this.mdEditorContainer.style.width = `${(this.attachedTile.width - this.attachedTile.innerMarginSide * 2)}px`;
            this.mdEditorContainer.style.display = 'block';
            this.mdEditorContainer.style.transform = `scale(${cameraPos.zoom}, ${cameraPos.zoom})`;
            this.editorView.focus();
        }
    }

    startEditing(tile) {
        this.attachedTile = tile;

        if (!tile.hasMarkdown) {
            let newState = EditorState.create({
                extensions: [mdEditorExtensions, this.editorChangeExt]
            });
            this.editorView.setState(newState);
            tile.markdownState = newState;
        } else {
            this.editorView.setState(tile.markdownState);
        }
        // console.log(this.editorView.dom);
        // this.adjustHeight(this.editorView.dom.scrollHeight);
    }

    endEditing() {
        if (this.editorView.state.doc.toString() === "") {
            this.attachedTile.markdownState = null;
            this.attachedTile.setTileHeight({});
        } else {
            this.updateTileMarkdown();
        }
        this.attachedTile = null;
        this.mdEditorContainer.style.display = 'none';
    }

    updateTileMarkdown() {
        this.attachedTile.markdownState = this.editorView.state;
    }


    // ********************Converting Coordinates***********************
    canvas2viewportX = (x, cameraPos) => {
        return (x * cameraPos.zoom) + cameraPos.x;
    }

    canvas2viewportY = (y, cameraPos) => {
        return (y * cameraPos.zoom) + cameraPos.y;
    }

}