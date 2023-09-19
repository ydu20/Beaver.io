

export default class TileControls {

    width = 50;
    height = 14;

    margin = 5;
    circleRadius = 6;
    squareLength = 10

    constructor () {
        this.x = -1;
        this.y = -1;
        this.squareX = -1;
        this.squareY = -1;
        this.circleX = -1;
        this.circleY = -1;
    }

    draw(x, y, ctx) {
        this.x = x;
        this.y = y;
        this.squareX = x + this.width - this.squareLength - this.margin;
        this.squareY = y + (this.height - this.squareLength) / 2;
        this.circleX = x + this.width - this.margin * 2 - this.circleRadius * 3;
        this.circleY = y + this.height / 2;

        // Run
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(this.circleX, this.circleY, this.circleRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Delete
        ctx.fillStyle = 'red';
        ctx.fillRect(this.squareX, this.squareY, this.squareLength, this.squareLength);
    }

    insideCircle(x, y) {
        let dx = x - this.circleX;
        let dy = y - this.circleY;
        return dx*dx + dy*dy <= this.circleRadius * this.circleRadius;
    }

    insideSquare(x, y) {
        return (
            x >= this.squareX &&
            x <= this.squareX + this.squareLength &&
            y >= this.squareY &&
            y <= this.squareY + this.squareLength
        );
    }
}