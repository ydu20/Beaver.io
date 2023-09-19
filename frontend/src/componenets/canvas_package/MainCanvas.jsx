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
                1,
                this,
                0,
            ),
            new Tile(
                this.initialTileX, 
                this.initialTileY + 100 + this.tileMargin, 
                2,
                this,
                1,
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

        // Max TileId
        this.maxTileId = 1;

        // Dependencies
        this.globalDependencies = new Map();

    }

    // ********************Update Global Dependencies***********************
    
    // n^2*max(tile.dependencies.size) operation -- very inefficient
    updateGlobalDependencies = () => {
        this.globalDependencies = new Map();
        this.tiles.forEach((tile) => {
            console.log(tile.id + ": " + tile.code);
            console.log(tile.dependencies);
            console.log(tile.variables);
            if (tile.dependencies) {
                tile.dependencies.forEach(varName => {
                    let parent = this.findParent(varName, tile.id);
                    if (parent) {
                        if (this.globalDependencies.has(tile)) {
                            this.globalDependencies.get(tile).push(parent);
                        } else {
                            this.globalDependencies.set(tile, [parent]);
                        }
                    }
                })
            }
        });

        console.log("Global dependencies refreshed")
        this.globalDependencies.forEach((val, key) => {
            console.log([key, val]);
        })
    }

    findParent(varName, id) {
        let maxId = -1;
        let parent = null;
        this.tiles.forEach((tile) => {
            if (
                tile.id !== id &&
                tile.variables &&
                tile.variables.has(varName) &&
                tile.id > maxId
            ) {
                parent = tile;
                maxId = parent.id;
            }
        })
        return parent;
    }

    // ********************Drawing Global Dependencies***********************

    drawFlow() {
        if (!this.globalDependencies) {
            return;
        }
        this.globalDependencies.forEach((sTiles, dTile) => {
            let dL = dTile.x;
            let dR = dTile.x + dTile.width;
            let dM = (dL + dR) / 2;

            sTiles.forEach(sTile => {

                let sL = sTile.x;
                let sR = sTile.x + sTile.width;
                let sM = (sL + sR) / 2;

                // console.log("Drawing line...")
                // console.log([sTile, dTile]);
                // console.log([dL, dR, dM, sL, sR, sM]);

                // Case 1
                if (dM > sL && dM < sR) {
                    if (dTile.y > sTile.y) {
                        this.drawArrow(
                            sM,
                            sTile.y + sTile.height,
                            dM,
                            dTile.y
                        );
                    } else {
                        this.drawArrow(
                            sM,
                            sTile.y,
                            dM,
                            dTile.y + dTile.height,
                        );
                    }
                } 
                // Case 2
                else if (dM <= sL && dR >= sL) {
                    if (dTile.y > sTile.y) {
                        this.drawArrow(
                            sL,
                            sTile.y + sTile.height / 2,
                            dM,
                            dTile.y,
                        );
                    } else {
                        this.drawArrow(
                            sL,
                            sTile.y + sTile.height / 2,
                            dM,
                            dTile.y + dTile.height,
                        );
                    }
                } else if (dM >= sR && dL <= sR) {
                    if (dTile.y > sTile.y) {
                        this.drawArrow(
                            sR,
                            sTile.y + sTile.height / 2,
                            dM,
                            dTile.y,
                        );
                    } else {
                        this.drawArrow(
                            sR,
                            sTile.y + sTile.height / 2,
                            dM,
                            dTile.y + dTile.height,
                        );
                    }
                }
                // Case 3
                else if (dR < sL) {
                    this.drawArrow(
                        sL,
                        sTile.y + sTile.height / 2,
                        dR,
                        dTile.y + dTile.height / 2,
                    );
                } else {
                    this.drawArrow(
                        sR,
                        sTile.y + sTile.height / 2,
                        dL,
                        dTile.y + dTile.height / 2,
                    );
                }

            });
        });
    }

    drawArrow(x1, y1, x2, y2) {
        let headLength = 10;   // length of the arrowhead
        let headWidth = 5;     // width of the arrowhead
    
        // Calculate angle of the line
        let angle = Math.atan2(y2 - y1, x2 - x1);
        
        // Calculate angles for the sides of the arrowhead
        let angle1 = Math.atan2(headWidth / 2, headLength);
        let angle2 = -angle1;
    
        // Draw the main line of the arrow
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    
        // Draw the arrowhead
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headLength * Math.cos(angle + angle1), y2 - headLength * Math.sin(angle + angle1));
        this.ctx.lineTo(x2 - headLength * Math.cos(angle + angle2), y2 - headLength * Math.sin(angle + angle2));
        this.ctx.lineTo(x2, y2);
        this.ctx.closePath();
        this.ctx.fill();
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

        // Draw dependency flow
        this.drawFlow();

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

        // Set editor zoom
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
        this.maxTileId += 1;
        this.tiles.push(
            new Tile(
                tile.x, 
                tile.y + tile.height + this.tileMargin, 
                this.maxZIndex, 
                this, 
                this.maxTileId,
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