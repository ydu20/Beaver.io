import TileControls from "./TileControls";

export default class Tile {

    innerMarginSide = 6;
    innerMarginTop = 24;
    innerMarginBottom = 10;
    initialEditorHeight = 35;
    
    constructor(x, y, width, height, zIndex, mainCanvas) {
        // Container fields
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.offsetX = 0;
        this.offsetY = 0;
        this.drag = false;

        // Code editor fields
        this.editorHeight = this.initialEditorHeight;
        this.code = '';

        // Output fields
        this.output = '';

        // Layering
        this.zIndex = zIndex;

        // Controls
        this.tileControls = new TileControls();

        // Selected
        this.selected = 0;

        // Toggle Selected
        this.mainCanvas = mainCanvas;
    }

    // ********************Drawing Function***********************
    draw(ctx) {
        // Drawing container
        ctx.fillStyle = 'lightgreen';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Drawing codebox
        ctx.fillStyle = 'white';
        ctx.fillRect(
            this.x + this.innerMarginSide,
            this.y + this.innerMarginTop,
            this.width - 2 * this.innerMarginSide,
            this.editorHeight
        )

        // Drawing text
        this.drawCode(
            ctx, 
            this.x + this.innerMarginSide + 2,
            this.y + this.innerMarginTop
        );

        // Drawing tile controls
        this.tileControls.draw(
            this.x + this.width - this.innerMarginSide - this.tileControls.width,
            this.y + (this.innerMarginTop - this.tileControls.height) / 2,
            ctx
        );
    }
    
    drawCode(ctx, x, y) {
        let lineHeight = 15.5;
        let spaceWidth = ctx.measureText(' ').width;
        let lines = this.code.split('\n');

        ctx.fillStyle = 'black';
        ctx.font = "13px monospace";
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic'

        y += 13;
        lines.forEach(line => {
            let currentX = x;

            for (let char of line) {
                if (char === '\t') {
                    for (let i = 0; i < 4; i++) {
                        ctx.fillText(' ', currentX, y);
                        currentX += spaceWidth;
                    }
                } else {
                    ctx.fillText(char, currentX, y);
                    currentX += ctx.measureText(char).width;
                }
            }
            y += lineHeight;
        });
    }

    // ********************Event Listeners***********************
    // Events return true if need re-render, false otherwise.
    onMouseDown(px, py) {
        // * Assumption is that the event is within the tile *
        
        if (!this.isInsideCodeBlock(px, py)) {
            this.selected = 1;
            this.mainCanvas.toggleSelected({status: 1, tile: this});
            // Drag & set offset
            this.drag = true;
            this.setOffset(px, py);
        }

        // No need to re-render
        return false;
    }

    onMouseMove(px, py) {
        if (this.drag) {
            this.moveTo(px, py);
            return true;
        } else {
            return false;
        }
    }

    onMouseUp() {
        this.drag = false;
        this.clearOffset();
        return false;
    }

    onClick(px, py) {
        if (this.isInsideCodeBlock(px, py)) {
            if (this.selected !== 2) {
                this.selected = 2;
                this.mainCanvas.toggleSelected({status: 2, tile: this});
            }
        } else if (this.tileControls.insideSquare(px, py)) {
            console.log("Deleting");
            this.mainCanvas.deleteTile(this);
        } else {
            if (this.selected !== 1) {
                this.selected = 1;
                this.mainCanvas.toggleSelected({status: 1, tile: this});
            }
        }
        return true;
    }

    onBlur() {
        this.selected = 0;
    }

    // ********************IsInside functions***********************
    isInside(x, y) {
        return (
            x > this.x &&
            x < this.x + this.width &&
            y > this.y && 
            y < this.y + this.height 
        );
    }

    isInsideCodeBlock(x, y) {
        return (
            x > this.x + this.innerMarginSide &&
            x < this.x + this.width - this.innerMarginSide &&
            y > this.y + this.innerMarginTop &&
            y < this.y + this.innerMarginTop + this.editorHeight
        );
    }

    // ********************Dragging helper functions***********************
    setOffset(x, y) {
        this.offsetX = x - this.x;
        this.offsetY = y - this.y;
    }

    clearOffset() {
        this.offSetX = 0;
        this.offSetY = 0;
    }

    moveTo(x, y) {
        this.x = x - this.offsetX;
        this.y = y - this.offsetY;
    }

    // ********************Reshaping functions***********************
    setEditorHeight(eh) {
        this.editorHeight = eh;
        this.height = Math.max(this.height, eh + this.innerMarginTop + this.innerMarginBottom);
    }
}