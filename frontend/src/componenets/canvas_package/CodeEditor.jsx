

export default class CodeEditor {

    initialEditorStyle = {
        position: 'fixed', 
        transformOrigin: 'top left', 
        zIndex: 2,
        resize: 'none', 
        overflowY: 'hidden',
        pre: {
            '-moz-tab-size' : 4,
              '-o-tab-size' : 4,
                 'tab-size' : 4,
        },
        display: 'none',
    }

    constructor(editor, mainCanvas) {
        this.editor = editor;
        this.attachedTile = null;
        this.mainCanvas = mainCanvas;

        // Styling
        for (let prop in this.initialEditorStyle) {
            editor.style[prop] = this.initialEditorStyle[prop];
        }

    }

    // *****************Drawing Function********************
    draw() {
        let cameraPos = this.mainCanvas.cameraPos;
        if (this.attachedTile) {
            this.editor.style.left = `${this.canvas2viewportX(this.attachedTile.x + this.attachedTile.innerMarginSide, cameraPos)}px`;
            this.editor.style.top = `${this.canvas2viewportY(this.attachedTile.y + this.attachedTile.innerMarginTop, cameraPos)}px`;
            this.editor.style.width = `${(this.attachedTile.width - this.attachedTile.innerMarginSide * 2)}px`;
            this.editor.style.display = 'block';
            this.editor.style.transform = `scale(${cameraPos.zoom}, ${cameraPos.zoom})`;
            this.editor.focus();
        }
    }

    // *****************Event Listeners********************

    onInput(e) {
        this.editor.value = e.target.value;
        this.attachedTile.code = e.target.value;
        this.adjustHeight();
    }

    onKeyDown(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            this.insertTab();
        }
    }

    // *****************Special Adjustments********************
    insertTab() {
        let cursorPos = this.editor.selectionStart;
        let beforeCursor = this.editor.value.slice(0, cursorPos);
        let afterCursor = this.editor.value.slice(cursorPos);

        let tabChar = '\t';
        this.editor.value = beforeCursor + tabChar + afterCursor;

        setTimeout(() => {
            this.editor.selectionStart = cursorPos + tabChar.length;
            this.editor.selectionEnd = cursorPos + tabChar.length;
        })
    }

    adjustHeight() {
        let oldHeight = this.attachedTile.editorHeight;
        this.editor.style.height = 'auto';
        this.editor.style.height = `${this.editor.scrollHeight}px`;
        this.attachedTile.setTileHeight(this.editor.scrollHeight, null);

        if (oldHeight !== this.attachedTile.editorHeight) {
            this.mainCanvas.render();
        }
    }

    // *****************Toggle coding functions********************

    startCoding(tile) {
        // Set code
        this.editor.value = tile.code;
        this.attachedTile = tile;
        this.editor.style.height = `${tile.editorHeight}px`;

    }

    endCoding() {
        this.attachedTile = null;
        this.editor.style.display = 'none';
    }

    // ********************Converting Coordinates***********************
    canvas2viewportX(x, cameraPos) {
        return (x * cameraPos.zoom) + cameraPos.x;
    }

    canvas2viewportY(y, cameraPos) {
        return (y * cameraPos.zoom) + cameraPos.y;
    }

}