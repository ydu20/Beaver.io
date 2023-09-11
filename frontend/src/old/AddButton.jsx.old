export default class AddButton {

    width = 70;
    height = 20;
    marginTop = -15;
    fontStyle = 'bold 20px monospace';

    constructor () {
        this.x = 0;
        this.y = 0;
        this.display = false;
        this.tile = null;
    }

    draw(ctx) {
        if (this.display) {
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

    isInside(px, py) {
        return (
            this.display &&
            px > this.x &&
            px < this.x + this.width &&
            py > this.y &&
            py < this.y + this.height
        );
    }

    attachTo(tile) {
        this.display = true;
        this.x = tile.x + (tile.width - this.width) / 2;
        this.y = tile.y + tile.height + this.marginTop;
        this.tile = tile;
    }

    detach() {
        this.display = false;
        this.tile = null;
    }
}
