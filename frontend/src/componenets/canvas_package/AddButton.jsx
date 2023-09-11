
export default class AddButton {
    
    width = 70;
    height = 20;
    marginTop = -15;
    fontStyle = 'bold 20px monospace';

    constructor(mainCanvas) {
        this.x = 0;
        this.y = 0;
        this.tile = null;
        this.mainCanvas = mainCanvas;
    }

    // ********************Draw Function***********************
    draw(ctx) {
        // Attached to a tile
        if (this.tile) {
            ctx.fillStyle = 'pink';
            ctx.fillRect(
                this.x, 
                this.y, 
                this.width, 
                this.height,
            )
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'black';
            ctx.font = this.fontStyle;
            ctx.fillText('+', this.x + this.width / 2, this.y + this.height / 2);
        }
    }

    // ********************Attach and Detach***********************
    attachTo(tile) {
        this.x = tile.x + (tile.width - this.width) / 2;
        this.y = tile.y + tile.height + this.marginTop;
        this.tile = tile;
    }

    detach() {
        this.tile = null;
    }

    // ********************IsInside functions***********************
    isInside(x, y) {
        return (
            this.tile && 
            x > this.x &&
            x < this.x + this.width &&
            y > this.y &&
            y < this.y + this.height
        );
    }

    // ********************Handlers***********************
    onClick() {
        // this.mainCanvas.
    }

}