

export default class TileControls {

    width = 50;
    height = 14;

    margin = 5;
    circleRadius = 6;
    squareLength = 10;
    arrowLength = 13;

    constructor () {
        this.x = -1;
        this.y = -1;
        this.squareX = -1;
        this.squareY = -1;
        this.circleX = -1;
        this.circleY = -1;
        this.arrowX = -1;
        this.arrowY = -1;
        this.blockX = -1;
        this.blockRadius = -1;

    }

    draw(x, y, ctx, drawFlow) {
        this.x = x;
        this.y = y;
        this.squareX = x + this.width - this.squareLength - this.margin;
        this.squareY = y + (this.height - this.squareLength) / 2;
        this.circleX = x + this.width - this.margin * 2 - this.circleRadius * 3;
        this.circleY = y + this.height / 2;
        this.arrowX = x + this.width - this.margin * 5.5 - this.circleRadius * 3 - this.squareLength;
        this.arrowY = y + (this.height) / 2 - 0.5;
        this.blockRadius = this.arrowLength / 2 + 1;
        this.blockX = this.arrowX + this.blockRadius;

        // Run
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(this.circleX, this.circleY, this.circleRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Delete
        ctx.fillStyle = 'red';
        ctx.fillRect(this.squareX, this.squareY, this.squareLength, this.squareLength);

        // Arrow
        this.drawArrowIcon(ctx, this.arrowX, this.arrowY, this.arrowX + this.arrowLength, this.arrowY, 3);

        // Block
        if (!drawFlow) {
            this.drawBlockSymbol(ctx, this.blockX, this.arrowY, this.blockRadius);
        }
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

    insideArrow(x, y) {
        let dx = x - this.blockX;
        let dy = y - this.arrowY;
        return dx*dx + dy*dy <= this.blockRadius * this.blockRadius;
    }

    // **********Drawing Functions**********
    drawArrowIcon(ctx, fromx, fromy, tox, toy, arrowWidth){
        //variables to be used when creating the arrow
        var headlen = 5;
        var angle = Math.atan2(toy-fromy,tox-fromx);
     
        ctx.save();
        ctx.strokeStyle = 'black';
     
        //starting path of the arrow from the start square to the end square
        //and drawing the stroke
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.lineWidth = arrowWidth;
        ctx.stroke();
     
        //starting a new path from the head of the arrow to one of the sides of
        //the point
        ctx.beginPath();
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),
                   toy-headlen*Math.sin(angle-Math.PI/7));
     
        //path from the side point of the arrow, to the other side point
        ctx.lineTo(tox-headlen*Math.cos(angle+Math.PI/7),
                   toy-headlen*Math.sin(angle+Math.PI/7));
     
        //path from the side point back to the tip of the arrow, and then
        //again to the opposite side point
        ctx.lineTo(tox, toy);
        ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),
                   toy-headlen*Math.sin(angle-Math.PI/7));
     
        //draws the paths created above
        ctx.stroke();
        ctx.restore();
    }

    drawBlockSymbol(context, x, y, radius) {
        // Draw the circle
        context.strokeStyle = 'red';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI);
        context.closePath();
        context.stroke();

    
        // Calculate starting and ending points for the diagonal line
        const startX = x - (radius * Math.cos(Math.PI / 4));
        const startY = y + (radius * Math.sin(Math.PI / 4));
        const endX = x + (radius * Math.cos(Math.PI / 4));
        const endY = y - (radius * Math.sin(Math.PI / 4));
    
        // Draw the diagonal line from bottom-left to top-right
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        context.stroke();
    }
}