import CodeEditor from "./CodeEditor";
import Tile from "./Tile";
import AddButton from "./AddButton";
import axios from '../AxiosInstance';
import JupyterManager from "./JupyterManager";
import Flow from "./Flow";
import AutoLayout from "./AutoLayout";
import MarkdownEditor from "./MarkdownEditor";
import IpynbManager from "./IpynbManager";

export default class MainCanvas {

    MAX_ZOOM = 5;
    MIN_ZOOM = 0.1;
    ZOOM_SENSITIVITY = 0.008;
    PAN_SENSITIVITY = 1;

    viewportWidth = 1800;
    viewportHeight = 1040;

    initialCanvasStyle = {
        position: 'fixed',
        left: 0,
        top: 0,
        width: `${this.viewportWidth}px`,
        height: `${this.viewportHeight}px`, 
        backgroundColor: '#fcfc97',
    }

    initialTileX = 150;
    initialTileY = 150;

    tileWidth = 512;
    tileMargin = 50;

    minimapWidth = 128;
    minimapMargin = 32;

    cxOffset = this.viewportWidth / 2;
    cxMax = 10000 + this.cxOffset;
    cxMin = -10000 + this.cxOffset;

    cyOffset = this.viewportHeight / 2;
    cyMax = 10000 + this.cyOffset;
    cyMin = -10000 + this.cyOffset;

    loadFromServer = false;
    saveToServer = false;

    debounceDelay = 3000;

    constructor(canvas, codeEditorContainer, markdownEditorContainer, window) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.codeEditor = new CodeEditor(codeEditorContainer, this);
        this.markdownEditor = new MarkdownEditor(markdownEditorContainer, this);
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
        canvas.width = this.viewportWidth * dpr;
        canvas.height = this.viewportHeight * dpr;
        this.ctx.scale(dpr, dpr);

        // Selected Status
        this.selected = {
            tile: null,
            status: 0,
        }

        // Add button
        this.addButton = new AddButton();

        // Global Dependencies
        this.globalDependencies = new Map();

        // Camera Position & Tiles
        this.cameraPos = {
            x: 0,
            y: 0,
            zoom: 1,
        };
        this.tiles = [];
        this.maxZIndex = -1;
        this.maxTileId = -1;

        // Flow
        this.flow = new Flow(this);

        // Debounce timeoutID
        this.debounceID = null;
        
        // Last D key press (for delete shortcut)
        this.lastDPress = 0;

        // ****Saving Loading Stuff Below (Don't modify)****

        if (window.setSaveStatus) {
            if (this.saveToServer) {
                window.setSaveStatus("Saved!");
            } else {
                window.setSaveStatus("Saving not enabled");
            }
        }

        // Setting up Panel from server/local
        if (this.loadFromServer) {
            this.loadPanel();
            return;
        }

        // Set camera position
        this.cameraPos = {
            x: 0,
            y: 0,
            zoom: 1,
        };

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
        ];

        // Max z-index
        this.maxZIndex = 2;

        // Max TileId
        this.maxTileId = 1;

        // Render
        this.render();


        //  **** Attachments **** 
        window.cleanUpTiles = () => {
            AutoLayout.generateLayout(this);
        }

        window.loadFromFile = (fileJson) => {
            IpynbManager.loadFromFile(fileJson, this);
        }
    }

    // ********************Find left/right/above/below tile***********************

    findTile = (tile, dir) => {
        let target = null;
        let xMaxDiff = tile.width * 2;
        let yMaxDiff = tile.height;

        let tileCentX = tile.x + tile.width / 2;
        let tileCentY = tile.y + tile.height / 2;
        let targetDist = -1;

        this.tiles.map(nt => {
            if (nt === tile) {
                return;
            }
            let diffX = Math.abs(nt.x - tile.x);
            let diffY = Math.abs(nt.y - tile.y);

            if (dir === 'left' || dir === 'right') {
                var xWeight = 2;
                var yWeight = 1;
            } else {
                var xWeight = 1;
                var yWeight = 3;
            }

            let dist = (xWeight * (nt.x + nt.width / 2 - tileCentX)) ** 2 + (yWeight * (nt.y + nt.height / 2 - tileCentY)) ** 2;

            if (targetDist < 0 || targetDist > dist) {
                if (
                    (dir === 'left' && nt.x < tile.x && diffY <= yMaxDiff) ||
                    (dir === 'right' && nt.x > tile.x && diffY <= yMaxDiff) ||
                    (dir === 'up' && nt.y < tile.y && diffX <= xMaxDiff) ||
                    (dir === 'down' && nt.y > tile.y && diffX <= xMaxDiff)
                ) {
                    target = nt;
                    targetDist = dist;
                }
            }
        });
        return target;
    }

    // ********************Handle Key Down Event***********************
    onKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (this.selected?.tile !== null) {
                this.selected.tile.executeCode();
            }
        } else if (e.key === 'd') {
            let currTime = new Date().getTime();
            if (currTime - this.lastDPress < 500 && this.selected.tile) {
                this.deleteTile(this.selected.tile);
            }
            this.lastDPress = currTime;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' 
                || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            
            let direction = e.key === 'ArrowUp' ? 'up' :
                e.key === 'ArrowDown' ? 'down':
                e.key === 'ArrowLeft' ? 'left':
                'right';

            if (this.selected.tile) {
                let neighbor = this.findTile(this.selected.tile, direction);
                if (neighbor) {
                    this.goToTile(neighbor);
                    // this.selected.tile.setSelected(0);
                    // neighbor.setSelected(1);
                    // this.maxZIndex += 1;
                    // neighbor.zIndex = this.maxZIndex;
                    // this.tiles.sort((a, b) => a.zIndex - b.zIndex);
                    // this.render();
                }
            }
        } else if (e.key === 'Enter') {
            if (this.selected.status === 1) {
                e.preventDefault();
                this.selected.tile.setSelected(2);
                this.render();
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (this.selected.tile) {
                if (e.shiftKey) {
                    this.goToTile(this.flow.prevInFlow(this.selected.tile));
                } else {
                    this.goToTile(this.flow.nextInFlow(this.selected.tile));
                }
            }
        }

    }

    goToTile = (dest) => {
        if (!dest || !this.selected.tile) {
            return;
        }
        this.selected.tile.setSelected(0);
        dest.setSelected(1);
        this.maxZIndex += 1;
        dest.zIndex = this.maxZIndex;
        this.tiles.sort((a, b) => a.zIndex - b.zIndex);
        this.render();
    }

    // ********************Loading / Saving***********************
    loadPanel = () => {
        axios.get('/panels/1').then(res => {
            let panelData = res.data;
            this.zoomCanvas(0, 0, panelData.zoom - this.cameraPos.zoom, false);
            this.panCanvas(panelData.x / panelData.zoom, panelData.y / panelData.zoom, false);
            
            this.tiles = panelData.tiles.map(tileData => {
                let tile = new Tile(
                    tileData.x,
                    tileData.y,
                    tileData.zIndex,
                    this,
                    tileData.id,
                );
                tile.output = tileData.output;
                tile.setTileHeight(null, tile.getOutputHeight());

                // TODO: BUG HERE
                tile.code = tileData.code;

                this.codeEditor.startCoding(tile);
                this.codeEditor.updateTileCode();
                this.codeEditor.adjustHeight(this.codeEditor.editorView.dom.scrollHeight);
                this.codeEditor.updateTileDependencies(this.codeEditor.editorView.state, this.codeEditor.editorView.state.doc.toString());
                this.codeEditor.endCoding();

                this.maxZIndex = Math.max(tileData.zIndex, this.maxZIndex);
                this.maxTileId = Math.max(tileData.id, this.maxTileId);
                return tile;
            });

            this.flow.updateEntireGraph();
            this.render();
        });
    }

    savePanel = () => {
        if (window.setSaveStatus) {
            window.setSaveStatus("Saving...");
        }
        let tilesData = this.tiles.map(tile => {
            return {
                id: tile.id,
                x: tile.x,
                y: tile.y,
                code: tile.code,
                output: tile.output,
                zIndex: tile.zIndex,
            };
        });

        let panelData = {
            id: '1',
            ownerEmail: 'ydu1701@gmail.com',
            x: this.cameraPos.x,
            y: this.cameraPos.y,
            zoom: this.cameraPos.zoom,
            tiles: tilesData,
        };

        // console.log(panelData.x, panelData.y, panelData.zoom);

        axios.post('/panels', panelData).then((res) => {
            // console.log(res.data);
            if (window.setSaveStatus) {
                window.setSaveStatus("Saved");
            }
        }).catch((err) => {
            if (window.setSaveStatus) {
                window.setSaveStatus("Error while saving");
            }
            console.log(err);
        });
    }

    autoSave = () => {
        if (this.saveToServer) {
            if (window.setSaveStatus) {
                window.setSaveStatus("Not saved");
            }
            clearTimeout(this.debounceID);
            this.debounceID = setTimeout(() => this.savePanel(), this.debounceDelay);
        }
    }

    // ******************** Draw Minimap ********************
    drawMinimap = () => {
        let vX = this.viewportWidth - this.minimapMargin - this.minimapWidth;
        let vY = this.viewportHeight - this.minimapMargin - this.minimapWidth;

        let x = this.viewport2canvasX(vX);
        let y = this.viewport2canvasY(vY);
        let width = this.minimapWidth / this.cameraPos.zoom;

        this.ctx.fillStyle = 'pink';
        this.ctx.fillRect(x, y, width, width);

        let vEX = (-this.cameraPos.x / this.cameraPos.zoom - this.cxMin) / (this.cxMax - this.cxMin) * this.minimapWidth;
        let vEY = (-this.cameraPos.y / this.cameraPos.zoom - this.cyMin) / (this.cyMax - this.cyMin) * this.minimapWidth;


        let eX = this.viewport2canvasX(vX + vEX);
        let eY = this.viewport2canvasY(vY + vEY);
        let eWidth = (this.viewportWidth / this.cameraPos.zoom) / (this.cxMax - this.cxMin) * this.minimapWidth / this.cameraPos.zoom;
        let eHeight = (this.viewportHeight / this.cameraPos.zoom / (this.cyMax - this.cyMin)) * this.minimapWidth / this.cameraPos.zoom;

        // console.log(x + eX, y + eY, eWidth, eHeight);
        // console.log(this.viewportWidth / this.cameraPos.zoom);
        // console.log(this.cxMax - this.cxMin);

        this.ctx.fillStyle = 'lightgreen';
        this.ctx.fillRect(eX, eY, eWidth, eHeight);
    }

    // ********************Render***********************
    render(simulateClick = false, x = 0, y = 0) {
        // Assumption is tiles already sorted by z-index

        // Clear canvas
        this.ctx.clearRect(
            -this.cameraPos.x / this.cameraPos.zoom, 
            -this.cameraPos.y / this.cameraPos.zoom, 
            this.viewportWidth / this.cameraPos.zoom, 
            this.viewportHeight / this.cameraPos.zoom
        );

        // Draw circle marking origin
        this.ctx.strokeStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(50, 50, 5, 0, 2 * Math.PI);
        this.ctx.stroke();

        // Draw dependency flow
        this.flow.draw(this.ctx);

        // Draw tiles layered by z indices
        this.tiles.map(tile => {tile.draw(this.ctx);});
        
        // Draw add button
        this.addButton.updateY();
        this.addButton.draw(this.ctx);

        // Draw code editor
        this.codeEditor.draw();

        // Draw markdown editor
        this.markdownEditor.draw();

        // Draw minimap
        this.drawMinimap();

        // Simulate mouse click
        if (simulateClick) {
            this.codeEditor.simulateClick(x, y);
        }
    }

    // ********************Panning and Zooming***********************

    panCanvas = (dx, dy, render = true) => {
        let prev = this.cameraPos;

        let minDx = this.cxMin - this.viewportWidth - (prev.x - this.viewportWidth) / prev.zoom;
        let maxDx = this.cxMax - this.viewportWidth - prev.x / prev.zoom;

        let minDy = this.cyMin - this.viewportHeight - (prev.y - this.viewportHeight) / prev.zoom;
        let maxDy = this.cyMax - this.viewportHeight - prev.y / prev.zoom;

        let dcx = Math.max(minDx, Math.min(maxDx, dx));
        let dcy = Math.max(minDy, Math.min(maxDy, dy));
        
        this.ctx.translate(dcx, dcy);
        this.cameraPos = {
            x: prev.x + dcx * prev.zoom,
            y: prev.y + dcy * prev.zoom,
            zoom: prev.zoom,
        }

        if (render) {
            this.autoSave();
            this.render();
        }
    }

    zoomCanvas = (x, y, delta, render = true) => {
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
        this.cameraPos = {
            x: x + lengthX,
            y: y + lengthY,
            zoom: newZoom,
        }

        this.panCanvas(0, 0, false);

        if (render) {
            this.autoSave();
            this.render();
        }
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

        this.render(true, e.clientX, e.clientY);
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
        });

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
        });

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
            hoveredTile?.tileControls.insideSquare(cvPX, cvPY) ||
            hoveredTile?.tileControls.insideArrow(cvPX, cvPY) ||
            hoveredTile?.tileControls.insideMD(cvPX, cvPY)) 
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
        } else if (
            this.selected.status === 2 && selected.status === 2 &&
            this.selected.tile !== selected.tile
        ) {
            this.codeEditor.endCoding();
            this.codeEditor.startCoding(selected.tile);
        }

        if (this.selected.status !== 3 && selected.status === 3) {
            this.markdownEditor.startEditing(selected.tile);
        } else if (this.selected.status === 3 && selected.status !== 3) {
            this.markdownEditor.endEditing();
        } else if (
            this.selected.status === 3 && selected.status === 3 &&
            this.selected.tile !== selected.tile
        ) {
            this.markdownEditor.endEditing();
            this.markdownEditor.startEditing(selected.tile);
        }

        this.selected = selected;
    }


    // ********************Add/delete tiles***********************
    addTile(tile) {
        this.maxZIndex != 1;
        this.maxTileId += 1;

        let x = tile === null ? this.initialTileX : tile.x;
        let y = tile === null ? this.initialTileY : tile.y + tile.height + this.tileMargin;
        
        let newTile = new Tile(
            x, 
            y, 
            this.maxZIndex, 
            this, 
            this.maxTileId,
        );
        
        this.tiles.push(newTile);
        this.autoSave();
        this.render();
        
        return newTile;
    }
    
    deleteTile(tile) {
        // Unfocus if selected
        if (this.selected.tile === tile) {
            this.toggleSelected({status: 0, tile: null});
        }

        this.flow.updateGraph(tile, null, null, tile.dependencies, tile.independencies);
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