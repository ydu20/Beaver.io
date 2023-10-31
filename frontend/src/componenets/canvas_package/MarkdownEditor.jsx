import {EditorView} from "@codemirror/view";
import {EditorState} from "@codemirror/state";
import {syntaxTree} from '@codemirror/language';

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
        // if (this.attachedTile) {
        //     this.updateTileMarkdown();
        // }
        if (update.heightChanged) {
            this.updateTileMarkdown();

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

        if (tile.markdownState === null) {
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
        this.attachedTile.markdownContent = this.constructMarkdownContent();
        this.attachedTile = null;
        this.mdEditorContainer.style.display = 'none';
    }

    updateTileMarkdown() {
        this.attachedTile.markdownState = this.editorView.state;

        // Look into syntax tree to determine markdown
        // return;
        let sTree = syntaxTree(this.editorView.state);
        let md = this.editorView.state.doc.toString();

        let level = 0;

        sTree.iterate({
            enter: (nodeRef) => {
                level++;
                console.log(level, nodeRef.type.name);
                console.log(md.substring(nodeRef.from, nodeRef.to));
            },
            leave: () => {
                level --;
            }
        });

        // console.log(sTree.topNode);

        // let cursor = sTree.cursor();
        // if (cursor.firstChild()) {
        //     console.log(cursor.type.name);
        //     console.log(cursor.node);
        //     // cursor.firstChild();
        //     // console.log(cursor.type.name);
        //     // cursor.nextSibling();
        //     // console.log(cursor.type.name);
        // }
    }

    constructMarkdownContent() {
        if (this.attachedTile.markdownState === null) {
            this.attachedTile.markdownContent = [];
            return;
        }

        let cursor = syntaxTree(this.editorView.state).cursor();
        let md = this.editorView.state.doc.toString();
        let lineStack = [];
        let markdownContent = [];

        let level = 0;

        // sTree.iterate({
        //     enter: (nodeRef) => {
        //         level ++;

        //         if (nodeRef.type.name.startsWith('ATXHeading')) {
        //             let mdObj = handleATXHeading(nodeRef, md);
        //             lineStack.push(mdObj);
        //         }
        //     },
        //     leave: () => {
        //         if (level === 1) {
                    
        //         }
        //         level --;
        //     }
        // })

        cursor.firstChild();

        do {
            markdownContent.push(this.recurseST(cursor, md));
        } while (cursor.nextSibling());
        return markdownContent;
    }

    recurseST(cursor, md) {
        
        // Different types of input
        if (cursor.node.type.name.startsWith("ATXHeading")) {
            return this.handleATXHeading(cursor, md);
        }
        if (
            cursor.node.type.name === "StrongEmphasis" ||
            cursor.node.type.name === "Emphasis"
        ) {
            return this.handleEmphasis(cursor, md);
        }
        if (cursor.node.type.name === "Blockquote") {
            return this.handleBlockquote(cursor, md);
        }
        if (
            cursor.node.type.name === "OrderedList" ||
            cursor.node.type.name === "BulletList"
        ) {
            return this.handleList(cursor, md);
        }

        // Other types
        let currIndex = cursor.from;
        let segments = [];

        if (cursor.firstChild()) {
            do {
                let childSegment = this.recurseST(cursor, md);
                if (currIndex < cursor.from) {
                    segments.push({
                        type: 'Text',
                        content: md.substring(currIndex, cursor.from),
                    });
                }
                segments.push(childSegment);
                currIndex = cursor.to;
            } while (cursor.nextSibling());
            cursor.parent();
        }
        if (currIndex < cursor.to) {
            segments.push({
                type: 'Text',
                content: md.substring(currIndex, cursor.to),
            });
        }

        return {
            type: cursor.node.type.name,
            content: segments,
        }
    }

    handleATXHeading(cursor, md) {
        let from = cursor.from;
        let to = cursor.to;
        let size = parseInt(cursor.node.type.name[10], 10);
        cursor.firstChild();
        from = cursor.node.to + 1;
        cursor.parent();

        return {
            type: 'ATXHeading',
            size: size,
            content: md.substring(from, to),
        }
    }

    handleEmphasis(cursor, md) {
        let from = cursor.from;
        let to = cursor.to;
        cursor.firstChild();
        from = cursor.node.to;
        if (cursor.nextSibling()) {
            to = cursor.node.from;
        }
        cursor.parent();

        return {
            type: cursor.node.type.name,
            content: md.substring(from, to),
        }
    }

    handleBlockquote(cursor, md) {
        let content = [];
        if (cursor.firstChild()) {
            do {
                if (cursor.node.type.name === "Paragraph") {
                    content = this.recurseST(cursor, md).content;
                }
            } while (cursor.nextSibling());
            cursor.parent();
        }

        return {
            type: "Blockquote",
            content: content,
        }
    }

    handleList(cursor, md) {
        let items = [];
        if (cursor.firstChild()) {
            do {
                if (cursor.node.type.name === "ListItem") {
                    cursor.firstChild();
                    cursor.nextSibling();
                    let listItem = this.recurseST(cursor, md);
                    cursor.parent();
                    items.push(listItem);
                }
            } while (cursor.nextSibling());
            cursor.parent();
        }
        return {
            type: cursor.node.type.name,
            items: items,
        }
    }



    // ********************Converting Coordinates***********************
    canvas2viewportX = (x, cameraPos) => {
        return (x * cameraPos.zoom) + cameraPos.x;
    }

    canvas2viewportY = (y, cameraPos) => {
        return (y * cameraPos.zoom) + cameraPos.y;
    }

}