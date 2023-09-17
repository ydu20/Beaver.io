import CodeEditor from "./CodeEditor";
import Tile from "./Tile";
import AddButton from "./AddButton";


export default class MainCanvas {

    canvasWidth = 1800;
    canvasHeight = 1040;

    initialCanvasStyle = {
        position: 'fixed',
        left: 0,
        top: 0,
        width: `${this.canvasWidth}px`,
        height: `${this.canvasHeight}px`, 
        backgroundColor: '#fcfc97',
    }

    initialTileX = 150;
    initialTileY = 150;

    tileWidth = 512;
    tileHeight = 128;

    tileMargin = 50;

    MAX_ZOOM = 5;
    MIN_ZOOM = 0.1;
    ZOOM_SENSITIVITY = 0.008;
    PAN_SENSITIVITY = 1;


    constructor(canvas, editorContainer, window) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.codeEditor = new CodeEditor(editorContainer, this);
        this.window = window;

        // JupyterManager
        // this.jupyterManager = new JupyterManager(window);
        this.jupyterManager = null;
        
        // Styling
        for (let prop in this.initialCanvasStyle) {
            canvas.style[prop] = this.initialCanvasStyle[prop];
        }

        // Adjust for pixel ratio
        let dpr = window.devicePixelRatio;
        canvas.width = this.canvasWidth * dpr;
        canvas.height = this.canvasHeight * dpr;
        this.ctx.scale(dpr, dpr);

        // Set camera position
        this.cameraPos = {
            x: 0,
            y: 0,
            zoom: 1,
            prevX: 0,
            prevY: 0,
            prevZoom: 1,
        }

        // Tiles
        this.tiles = [
            new Tile(
                this.initialTileX, 
                this.initialTileY, 
                this.tileWidth, 
                this.tileHeight, 
                1,
                this,
            ),
            new Tile(
                this.initialTileX, 
                this.initialTileY + this.tileHeight + this.tileMargin, 
                this.tileWidth, 
                this.tileHeight, 
                2,
                this,
            ),
        ]

        // Selected Status
        this.selected = {
            tile: null,
            status: 0,
        }

        // Add button
        this.addButton = new AddButton();

        // Render
        this.render();

        // Max z-index
        this.maxZIndex = 2;

    }

    // ********************Render***********************
    render() {
        // Assumption is tiles already sorted by z-index

        // Clear canvas
        this.ctx.clearRect(
            -this.cameraPos.x / this.cameraPos.zoom, 
            -this.cameraPos.y / this.cameraPos.zoom, 
            this.canvasWidth / this.cameraPos.zoom, 
            this.canvasHeight / this.cameraPos.zoom
        );

        // Draw circle marking origin
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, 2 * Math.PI);
        this.ctx.stroke();

        // Draw tiles layered by z indices
        this.tiles.map(tile => {tile.draw(this.ctx);});
        
        // Draw add button
        this.addButton.updateY();
        this.addButton.draw(this.ctx);

        // Draw code editor
        this.codeEditor.draw();
    }

    // ********************Panning and Zooming***********************

    panCanvas = (dx, dy) => {
        let prev = this.cameraPos;
        
        this.ctx.translate(dx / prev.zoom, dy / prev.zoom);
        this.cameraPos = {
            x: prev.x + dx,
            y: prev.y + dy,
            zoom: prev.zoom,
            prevX: prev.x,
            prevY: prev.y,
            prevZoom: prev.zoom,
        }

        this.render();
    }

    zoomCanvas = (x, y, delta) => {
        console.log("Zooming")
        let prev = this.cameraPos;

        let newZoom = prev.zoom + delta;
        newZoom = Math.min( newZoom, this.MAX_ZOOM );
        newZoom = Math.max( newZoom, this.MIN_ZOOM );

        let zoomRatio = newZoom / prev.zoom;

        let lengthX = (prev.x - x) * (zoomRatio);
        let lengthY = (prev.y - y) * (zoomRatio);

        // Set ctx zoom
        let translateX = (x - prev.x) / prev.zoom;
        let translateY = (y - prev.y) / prev.zoom;
        
        this.ctx.translate(translateX, translateY);
        this.ctx.scale(zoomRatio, zoomRatio);
        this.ctx.translate(-translateX, -translateY);

        // // Set editor zoom
        // this.codeEditor.editor.style.transform = `scale(${newZoom}, ${newZoom})`

        this.cameraPos = {
            x: x + lengthX,
            y: y + lengthY,
            zoom: newZoom,
            prevX: prev.x,
            prevY: prev.y,
            prevZoom: prev.zoom,
        }

        this.render();
    }

    // ********************Event Listeners***********************
    onClick(e) {
        let cvPX = this.viewport2canvasX(e.clientX);
        let cvPY = this.viewport2canvasY(e.clientY);

        // Check if clicked on add button
        if (this.addButton.isInside(cvPX, cvPY)) {
            this.addTile(this.addButton.tile);
            return;
        }

        // Assumption is that tiles are already sorted by zIndex
        let clickedTile = null;
        this.tiles.map(tile => {
            if (tile.isInside(cvPX, cvPY)) {
                clickedTile = tile;
            }
        })

        // Attach add button & pass in click signal
        if (clickedTile) {
            clickedTile.onClick(cvPX, cvPY);
        }

        this.render();
    }

    onMouseDown(e) {
        let cvPX = this.viewport2canvasX(e.clientX);
        let cvPY = this.viewport2canvasY(e.clientY);
        
        // Check if pressed on add button
        if (this.addButton.isInside(cvPX, cvPY)) {
            return;
        }

        // Find pressed tile
        let pressedTile = null;
        this.tiles.map(tile => {
            if (tile.isInside(cvPX, cvPY)) {
                // Handle overlap case
                pressedTile = pressedTile?.zIndex > tile.zIndex ? pressedTile : tile;
            }
        });

        // Pass in mouse down event, blurr every other tile
        this.tiles.map(tile => {
            if (tile === pressedTile) {
                tile.onMouseDown(cvPX, cvPY);
                this.maxZIndex += 1;
                tile.zIndex = this.maxZIndex;
            } else {
                tile.onBlur();
            }
        })

        // Handle case of no tile selected
        if (!pressedTile && this.selected.status) {
            this.toggleSelected({status: 0, selected: null});
        }

        // Sort tiles based on zIndex
        this.tiles.sort((a, b) => a.zIndex - b.zIndex);

        // Always rerender to bring pressed tile to forefront
        this.render();
    }

    onMouseUp(e) {
        // Sending event to all tiles for simplicity
        let reRender = false;
        this.tiles.map(tile => {
            reRender = reRender || tile.onMouseUp();
        })

        if (!this.addButton.tile && this.selected.status) {
            this.addButton.attachTo(this.selected.tile);
        }

        if (reRender) {
            this.render();
        }
    }

    onMouseMove(e) {
        let cvPX = this.viewport2canvasX(e.clientX);
        let cvPY = this.viewport2canvasY(e.clientY);

        // Check if tile is dragged
        let tileDragged = false;
        this.tiles.map(tile => {
            // Only one tile should be dragged, for which onMouseMove will 
            // return true because it needs re-rendering
            tileDragged = tileDragged || tile.onMouseMove(cvPX, cvPY);
        });

        // If no tile is dragged, check for hoverings
        let addButtonChanged = false;
        let hoveredTile = null;
        let covered = false;
        if (!tileDragged) {
            this.tiles.map(tile => {
                if (this.isInsideBox(
                        cvPX, 
                        cvPY,
                        tile.x,
                        tile.x + tile.width,
                        tile.y,
                        tile.y + tile.height + this.addButton.marginTop +
                            this.addButton.height * 1.5
                    )
                ) {
                    // Handle overlap case
                    hoveredTile = hoveredTile?.zIndex > tile.zIndex ? 
                        hoveredTile : 
                        tile
                    ;
                }
            })

            // Check if the add button space is covered by another tile
            // with a higher z-index
            if (hoveredTile) {
                let addButtonX = hoveredTile.x + (hoveredTile.width - this.addButton.width) / 2;
                let addButtonY = hoveredTile.y + hoveredTile.height + this.addButton.marginTop;
                this.tiles.map(tile => {
                    if (tile !== hoveredTile) {
                        covered = covered || (
                            tile.zIndex > hoveredTile.zIndex && (
                                tile.isInside(addButtonX, addButtonY) ||
                                tile.isInside(addButtonX + this.addButton.width, addButtonY) ||
                                tile.isInside(addButtonX, addButtonY + this.addButton.height) ||
                                tile.isInside(addButtonX + this.addButton.width, addButtonY + this.addButton.height)
                            )
                        )
                    }
                });
            }
        }

        let oldAddButtonTile = this.addButton.tile;
        
        if (!tileDragged && hoveredTile) {
            
            hoveredTile.onMouseMove(cvPX, cvPY);

            // Attach add button if not covered
            if (!covered && !this.selected.status) {
                this.addButton.attachTo(hoveredTile);
            }
        } else if (tileDragged || (!this.selected.status && this.addButton.tile)) {
            this.addButton.detach();
        }

        if (!tileDragged && (this.addButton.isInside(cvPX, cvPY) ||
            hoveredTile?.tileControls.insideCircle(cvPX, cvPY) ||
            hoveredTile?.tileControls.insideSquare(cvPX, cvPY))
        ) {
            this.canvas.classList.add('pointer');
        } else {
            this.canvas.classList.remove('pointer');
        }


        addButtonChanged = oldAddButtonTile !== this.addButton.tile;

        // Conditional render
        if (tileDragged || addButtonChanged) {
            this.render();
        }
    }

    onWheel(e) {
        e.preventDefault();
        if (e.ctrlKey) {
            this.zoomCanvas(e.clientX, e.clientY, -e.deltaY * this.ZOOM_SENSITIVITY);
        } else {
            this.panCanvas(-e.deltaX * this.PAN_SENSITIVITY, -e.deltaY * this.PAN_SENSITIVITY);
        }
    }

    // ********************Toggle Selected***********************
    toggleSelected(selected) {
        if (selected.status) {
            this.addButton.attachTo(selected.tile);
        } else {
            this.addButton.detach();
        }

        if (this.selected.status !== 2 && selected.status === 2) {
            this.codeEditor.startCoding(selected.tile);
        } else if (this.selected.status === 2 && selected.status !== 2) {
            this.codeEditor.endCoding();
        } else if (this.selected.status === 2 && selected.status === 2 &&
            this.selected.tile !== selected.tile) {
                this.codeEditor.endCoding();
                this.codeEditor.startCoding(selected.tile);
            }
        this.selected = selected;

        // this.render();
    }

    // ********************Add/delete tiles***********************
    addTile(tile) {
        this.maxZIndex != 1;
        this.tiles.push(
            new Tile(
                tile.x, 
                tile.y + tile.height + this.tileMargin, 
                this.tileWidth, 
                this.tileHeight, 
                this.maxZIndex, 
                this
            )
        );
        
        this.render();
    }
    
    deleteTile(tile) {
        // Unfocus if selected
        if (this.selected.tile === tile) {
            this.toggleSelected({status: 0, tile: null});
        }
        this.tiles.splice(this.tiles.indexOf(tile), 1);
        
        this.render();
    }

    // *********************** Handling Pointer CSS **************************
    setPointer(display) {
        if (display) {
            this.canvas.classList.add('pointer');
        } else {
            this.canvas.classList.remove('pointer');
        }
    }

    // *********************** Destroy **************************
    destroy() {
        this.codeEditor.destroy();
    }

    // ********************Converting Coordinates***********************
    viewport2canvasX(x) {
        return (x - this.cameraPos.x) / this.cameraPos.zoom;
    }

    viewport2canvasY(y) {
        return (y - this.cameraPos.y) / this.cameraPos.zoom;
    }

    isInsideBox = (x, y, x1, x2, y1, y2) => {
        return (
            x > x1 && x < x2 && y > y1 && y < y2
        )
    }

}