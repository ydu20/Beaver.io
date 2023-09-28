import TileControls from "./TileControls";

export default class Tile {

    innerMarginSide = 6;
    innerMarginTop = 24;
    innerMarginBottom = 10;
    cornerRadius = 5;
    editorOutputMargin = -2;
    minimumEditorHeight = 35;
    minimumOutputHeight = 0;
    minimumHeight = this.innerMarginTop + 
    this.minimumEditorHeight + 
    this.editorOutputMargin + 
    this.minimumOutputHeight + 
    this.innerMarginBottom;
    
    constructor(x, y, zIndex, mainCanvas, id) {
        // Container fields
        this.x = x;
        this.y = y;
        this.width = this.innerMarginSide * 2 + 2 + 8.6 * 80 + 8;
        this.height = this.minimumHeight;
        this.offsetX = 0;
        this.offsetY = 0;
        this.drag = false;

        // Code editor fields
        this.editorHeight = this.minimumEditorHeight;
        this.code = '';
        this.coloredCode = []

        // Output fields
        this.outputHeight = this.minimumOutputHeight;
        this.output = '';

        // Layering
        this.zIndex = zIndex;

        // Controls
        this.tileControls = new TileControls();

        // Selected
        this.selected = 0;

        // Main canvas
        this.mainCanvas = mainCanvas;

        // Jupyter manager
        this.jupyterManager = mainCanvas.jupyterManager;

        // Execution Count
        this.executionCount = -1;

        // Dependent & Independent variables
        this.dependencies = new Set();
        this.independencies = new Set();

        // ID
        this.id = id;
    }

    // ********************Drawing Function***********************
    draw(ctx) {
        // Drawing container
        ctx.beginPath();
        let radius = this.cornerRadius;
        ctx.arc(this.x + radius, this.y + radius, radius, Math.PI, 1.5 * Math.PI);
        ctx.arc(this.x + this.width - radius, this.y + radius, radius, 1.5 * Math.PI, 2 * Math.PI);
        ctx.arc(this.x + this.width - radius, this.y + this.height - radius, radius, 0, 0.5 * Math.PI);
        ctx.arc(this.x + radius, this.y + this.height - radius, radius, 0.5 * Math.PI, Math.PI);
        ctx.closePath();
        ctx.lineWidth = 3;
        if (this.selected === 2) {
            ctx.strokeStyle = 'limegreen';
        } else if (this.selected === 1) {
            ctx.strokeStyle = '#576cf3';
        } else {
            ctx.strokeStyle = 'silver';
            ctx.lineWidth = 1;
        }
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // Drawing codebox
        ctx.fillStyle = 'white';
        ctx.fillRect(
            this.x + this.innerMarginSide,
            this.y + this.innerMarginTop,
            this.width - 2 * this.innerMarginSide,
            this.editorHeight
        );


        if (this.selected === 2) {
            ctx.strokeStyle = 'limegreen';
        } else {
            ctx.strokeStyle = 'silver';
        }
        ctx.lineWidth = 1;
        
        // Add 1px margin so border doesn't get covered
        ctx.strokeRect(
            this.x + this.innerMarginSide - 1,
            this.y + this.innerMarginTop - 1,
            this.width - 2 * this.innerMarginSide + 2,
            this.editorHeight + 2
        );

        // Drawing code
        this.drawColoredCode(
            ctx,
            this.x + this.innerMarginSide + 2,
            this.y + this.innerMarginTop
        );

        // Drawing output
        this.drawText(
            ctx,
            this.x + this.innerMarginSide - 2,
            this.y + this.innerMarginTop + this.editorHeight + this.editorOutputMargin,
            this.output
        )

        // Drawing tile controls
        this.tileControls.draw(
            this.x + this.width - this.innerMarginSide - this.tileControls.width,
            this.y + (this.innerMarginTop - this.tileControls.height) / 2,
            ctx
        );

        // Drawing status
        ctx.fillStyle = 'black';
        ctx.font = "12px monospace";
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic'

        ctx.fillText(`[${this.executionCount == -1 ? ' ': this.executionCount}]`, this.x + 5, this.y + 14);
    }
    
    drawText(ctx, x, y, text) {
        ctx.fillStyle = 'black';
        ctx.font = "14px monospace";
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic'

        let lineHeight = 18
        let spaceWidth = 8.6
        let lines = text.split('\n');

        y += 21
        x += 6
        lines.forEach(line => {
            let currentX = x;

            for (let char of line) {
                if (char === '\t') {
                    // console.log("Tab encountered while drawing");
                    for (let i = 0; i < 4; i++) {
                        // console.log(currentX);
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

    drawColoredCode(ctx, x, y) {
        ctx.font = "14px monospace";
        ctx.textAlign = 'start'
        ctx.textBaseline = 'alphabetic'
        let lineHeight = 18
        let charWidth = 8.57
        
        y += 16.5
        x += 4
        this.coloredCode.forEach(line => {
            let currentX = x
            line.forEach(block => {

                if (block.color) {
                    ctx.fillStyle = block.color
                } else {
                    ctx.fillStyle = 'black'
                }

                for (let char of block.text) {
                    ctx.fillText(char, currentX, y)
                    currentX += charWidth
                }
            })
            y += lineHeight;
        })
    }

    // ***********************Distance to Another Tile***********************
    distanceTo = (tile) => {
        // Actually distance squared
        if (this.x < tile.x + tile.width && 
            this.x + this.width > tile.x && 
            this.y < tile.y + tile.height && 
            this.y + this.height > tile.y) {
          return 0;
        }

        let dx = Math.max(this.x - (tile.x + tile.width), tile.x - (this.x + this.width), 0);
        let dy = Math.max(this.y - (tile.y + tile.height), tile.y - (this.y + this.height), 0);
        return dx * dx + dy * dy;
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
            this.setSelected(2);
        } else if (this.tileControls.insideSquare(px, py)) {
            this.mainCanvas.deleteTile(this);
        } else if (this.tileControls.insideCircle(px, py)) {
            // Execute current codeblock
            this.executeCode();
        } else {
            this.setSelected(1);
        }
        return true;
    }

    onBlur() {
        this.setSelected(0);
    }

    // ********************Set Selected Status***********************

    setSelected = (status) => {
        if (status === 0) {
            this.selected = 0;
        } else if (status === 1 && this.selected !== 1) {
            this.selected = 1 ;
            this.mainCanvas.toggleSelected({status: 1, tile: this});
        } else if (status === 2 && this.selected !== 2) {
            this.selected = 2;
            this.mainCanvas.toggleSelected({status: 2, tile: this});
        }
    }

    // ********************Execute Code***********************
    executeCode = () => {
        this.jupyterManager.runCell(this.code).then(res => {
            if (res.exeCount) {
                this.executionCount = res.exeCount;
            }
            this.output = res.output;

            this.setTileHeight(null, this.getOutputHeight());
            
            this.mainCanvas.render();
        }).catch(err => {
            console.log(err);
        });
    }

    getOutputHeight = () => {
        let lineCount = 0;
        for (let i = 0; i < this.output.length; i++) {
            if (this.output.charAt(i) === '\n') {
                lineCount++;
            }
        }

        // console.log(this.output);
        // console.log(lineCount);
        
        let cHeight = lineCount == 0 ? 0 : 
        lineCount == 1 ? 18 * (lineCount + 1) - 6.5:
        18 * (lineCount) - 6.5;

        // console.log(cHeight);
        return cHeight;
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

    setTileHeight(eh, oh) {
        if (eh != null) {
            this.editorHeight = Math.max(this.minimumEditorHeight, eh);
        }
        if (oh !== null) {
            this.outputHeight = Math.max(this.minimumOutputHeight, oh);
        }


        this.height = this.innerMarginTop + 
            this.editorHeight +
            this.editorOutputMargin +
            this.outputHeight +
            this.innerMarginBottom
        ;
    }

}