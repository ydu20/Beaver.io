import TileControls from "./TileControls";

export default class Tile {

    innerMarginSide = 6;
    innerMarginTop = 24;
    innerMarginBottom = 10;
    innerMarginMiddle = 14;
    cornerRadius = 5;
    editorOutputMargin = -2;
    minimumEditorHeight = 35;
    minimumOutputHeight = 0;
    minimumMarkdownHeight = 35;
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
        this.codeState = null;
        this.coloredCode = []

        // Output fields
        this.outputHeight = this.minimumOutputHeight;
        this.output = '';

        // Markdown fields
        // this.hasMarkdown = false;
        this.markdownHeight = 0;
        this.markdownState = null;
        this.markdownContent = [];

        // Layering
        this.zIndex = zIndex;

        // Controls
        this.tileControls = new TileControls();

        // Selected
        // 0 = not selected, 1 = selected but not coding/MDing,
        // 2 = coding, 3 = MDing
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

        // Draw flow
        this.drawFlow = true;
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
        } else if (this.selected === 1 || this.selected === 3) {
            ctx.strokeStyle = '#576cf3';
        } else {
            ctx.strokeStyle = 'silver';
            ctx.lineWidth = 1;
        }
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.fill();

        // Drawing markdown box
        if (this.markdownState != null) {
            // Currently editing
            if (this.selected === 3) {
                ctx.fillStyle = 'white';
                ctx.fillRect(
                    this.x + this.innerMarginSide,
                    this.y + this.innerMarginTop,
                    this.width - 2 * this.innerMarginSide,
                    this.markdownHeight
                );

                ctx.strokeStyle = 'silver';
                ctx.lineWidth = 1;
    
                // Add 1px margin so border doesn't get covered
                ctx.strokeRect(
                    this.x + this.innerMarginSide - 1,
                    this.y + this.innerMarginTop - 1,
                    this.width - 2 * this.innerMarginSide + 2,
                    this.markdownHeight + 2
                );
            } 
            // Not editing
            else {
                this.drawMarkdownContent(ctx);
            }
        }
        
        // Drawing codebox
        ctx.fillStyle = 'white';
        ctx.fillRect(
            this.x + this.innerMarginSide,
            this.getCodeBlockY(),
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
            this.getCodeBlockY() - 1,
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
        let oX = this.x + this.innerMarginSide + 4;
        let oY = this.y + this.innerMarginTop + this.editorHeight + this.editorOutputMargin + 21;
        this.drawText(ctx, oX, oX, oY, this.output, true);

        // Drawing tile controls
        this.tileControls.draw(
            this.x + this.width - this.innerMarginSide - this.tileControls.width,
            this.y + (this.innerMarginTop - this.tileControls.height) / 2,
            ctx, 
            this.drawFlow
        );

        // Drawing status
        ctx.fillStyle = 'black';
        ctx.font = "12px monospace";
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic'

        ctx.fillText(`[${this.executionCount == -1 ? ' ': this.executionCount}]`, this.x + 5, this.y + 14);
    }

    drawMarkdownContent(ctx) {
        let x = this.x + this.innerMarginSide + 4;
        let y = this.y + this.innerMarginTop + 15;

        this.markdownContent.forEach(item => {
            [x, y] = this.drawMDHelper(x, y, item, ctx);
        });

        this.markdownHeight = y - 12 - this.y - this.innerMarginTop;
        this.setTileHeight({});
    }

    drawMDHelper(x, y, item, ctx) {
        if (item.type === "ATXHeading") {
            let sizing = [
                {fontSize: 22, yOffset: 33},
                {fontSize: 20, yOffset: 30},
                {fontSize: 18, yOffset: 27},
                {fontSize: 16, yOffset: 24},
                {fontSize: 14, yOffset: 21},
                {fontSize: 12, yOffset: 18},
            ]

            let fontSize = sizing[item.size - 1].fontSize;
            let yOffset = sizing[item.size - 1].yOffset;

            y += yOffset;
            ctx.fillStyle = 'black';
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'start';
            ctx.textBaseline = 'alphabetic'
            ctx.fillText(item.content, x, y - (yOffset - fontSize) * 2);
        }
        else if (item.type === "Paragraph") {
            item.content.forEach((segment, i) => {
                let newLine = i === item.content.length - 1;
                let style = segment.type === "Emphasis" ? "italic 14px monospace" : 
                    segment.type === "StrongEmphasis" ? "bold 14px monospace" :
                    "14px monospace";
                
                [x, y] = this.drawText(ctx, this.x + this.innerMarginSide + 4, x, y, segment.content, newLine, style);
            });
        }

        return [x, y];
    }
    
    drawText(ctx, xStart, x, y, text, newLine, style) {
        ctx.fillStyle = 'black';
        ctx.font = style ? style : "14px monospace";
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic'

        let lineHeight = 18
        let spaceWidth = 8.6
        let lines = text.split('\n');

        let currentX = x;
        lines.forEach((line, i) => {
            if (i > 0) {
                currentX = xStart;
            }
            for (let char of line) {
                let charWidth = ctx.measureText(char).width;
                if (char === '\t') {
                    charWidth = ctx.measureText(' ').width * 4;
                }
                if (currentX + charWidth >= this.x + this.width - this.innerMarginSide) {
                    currentX = xStart;
                    y += lineHeight;
                }
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
        
        if (newLine) {
            return [xStart, y];
        } else {
            return [currentX, y - lineHeight];
        }
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

            for (let block of line) {
                let stop = false;
                if (block.color) {
                    ctx.fillStyle = block.color
                } else {
                    ctx.fillStyle = 'black'
                }

                for (let char of block.text) {
                    ctx.fillText(char, currentX, y)
                    currentX += charWidth
                    if (currentX + charWidth >= this.x + this.width - this.innerMarginSide) {
                        stop = true;
                        break;
                    }
                }
                if (stop) {
                    break;
                }
                
            }
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
            this.mainCanvas.flow.updateFlowByPosChange(this);
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
        } else if (this.tileControls.insideArrow(px, py)) {
            this.drawFlow = !this.drawFlow;
            this.mainCanvas.flow.flowOrderMap = null;
            this.mainCanvas.flow.flowOrderArray = null;
        } else if (this.tileControls.insideMD(px, py)) {
            this.setSelected(3);
            // this.hasMarkdown = true;
        } else if (this.markdownState != null && this.isInsideMarkdown(px, py)) {
            this.setSelected(3);
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
        } else if (status === 3 && this.selected !== 3) {
            this.selected = 3;
            this.mainCanvas.toggleSelected({status: 3, tile: this});
        }
    }

    // ********************Execute Code***********************
    executeCode = () => {
        this.jupyterManager.runCell(this.codeState.doc.toString()).then(res => {
            if (res.exeCount) {
                this.executionCount = res.exeCount;
            } else {
                this.executionCount = -1;
            }
            this.output = res.output;

            this.setTileHeight({oh: this.getOutputHeight()});
            
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
        
        let cHeight = lineCount == 0 ? 0 : 
        lineCount == 1 ? 18 * (lineCount + 1) - 6.5:
        18 * (lineCount) - 6.5;

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
            y > this.getCodeBlockY() &&
            y < this.getCodeBlockY() + this.editorHeight
        );
    }

    isInsideMarkdown(x, y) {
        return (
            x > this.x + this.innerMarginSide &&
            x < this.x + this.width - this.innerMarginSide &&
            y > this.y + this.innerMarginTop &&
            y < this.y + this.innerMarginTop + this.markdownHeight
        );
    }

    getCodeBlockY = () => {
        let mdOffset = this.markdownState != null ? this.markdownHeight + this.innerMarginMiddle : 0;
        return (this.y + this.innerMarginTop + mdOffset);
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
    setTileHeight(update) {
        if ('eh' in update) {
            this.editorHeight = Math.max(this.minimumEditorHeight, update.eh);
        }
        if ('oh' in update) {
            this.outputHeight = Math.max(this.minimumOutputHeight, update.oh);
        }
        if ('mh' in update) {
            this.markdownHeight = Math.max(this.minimumMarkdownHeight, update.mh);
        }

        let mdOffset = this.markdownState != null ? this.markdownHeight + this.innerMarginMiddle : 0;

        this.height = this.innerMarginTop + 
            mdOffset + 
            this.editorHeight +
            this.editorOutputMargin +
            this.outputHeight +
            this.innerMarginBottom
        ;
    }
}