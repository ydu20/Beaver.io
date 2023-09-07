import {Box} from '@mui/material';
import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import Tile from './Tile';
import CodeEditor from './CodeEditor';
import AddButton from './AddButton';

export default function MainCanvas() {

    const canvasWidth = 1800;
    const canvasHeight = 1040;

    const canvasRef = useRef(null);
    const editorRef = useRef(null);

    const tileWidth = 512;
    const tileHeight = 128;

    const tileX = 150;
    const tileY = 150;

    const tileMargin = 50;

    const MAX_ZOOM = 5;
    const MIN_ZOOM = 0.1;
    const SCROLL_SENSITIVITY = 0.008;
    const PAN_SENSITIVITY = 1;

    var cameraPos = {
        x: 0,
        y: 0,
        zoom: 1,
        prevX: 0,
        prevY: 0,
        prevZoom: 1,
    };

    // Converting coordinates
    const viewport2canvasX = (x) => {
        return (x - cameraPos.x) / cameraPos.zoom;
    }
    const viewport2canvasY = (y) => {
        return (y - cameraPos.y) / cameraPos.zoom;
    }

    const canvas2viewportX = (x) => {
        return (x * cameraPos.zoom) + cameraPos.x;
    }

    const canvas2viewportY = (y) => {
        return (y * cameraPos.zoom) + cameraPos.y;
    }

    // Code tile handling
    const [selectedTile, setSelectedTile] = useState(null);

    const startCoding = (tile) => {
        setSelectedTile(tile);
    }

    // handle pointer class
    const setPointer = (option) => {
        if (option) {
            canvasRef.current.classList.add('pointer');
        } else {
            canvasRef.current.classList.remove('pointer');
        }
    }

    // Tiles
    var tiles = [
        new Tile(tileX, tileY, tileWidth, tileHeight, startCoding, 1),
        new Tile(tileX, tileY + tileHeight + tileMargin, tileWidth, tileHeight, startCoding, 2),
    ];

    // Add button
    const [addButton] = useState(new AddButton());

    // Panning
    const panCanvas = (dx, dy) => {

        setCameraPos(prev => {
            // Pan on ctx
            let ctx = canvasRef.current.getContext('2d');
            ctx.translate(dx / prev.zoom, dy / prev.zoom);
            setPointer(false);

            return {
                x: prev.x + dx,
                y: prev.y + dy, 
                zoom: prev.zoom, 
                prevX: prev.x, 
                prevY: prev.y, 
                prevZoom: prev.zoom
            };
        });
    }

    // Zooming
    const adjustZoom = (px, py, delta) => {

        // setCameraPos(prev => {
        //     let newZoom = prev.zoom + delta;
        //     newZoom = Math.min( newZoom, MAX_ZOOM );
        //     newZoom = Math.max( newZoom, MIN_ZOOM );

        //     let zoomRatio = newZoom / prev.zoom;

        //     let lengthX = (prev.x - px) * (zoomRatio);
        //     let lengthY = (prev.y - py) * (zoomRatio);

        //     // Zoom on ctx
        //     let ctx = canvasRef.current.getContext('2d');
        //     let translateX = (px - prev.x) / prev.zoom;
        //     let translateY = (py - prev.y) / prev.zoom;
            
        //     ctx.translate(translateX, translateY);
        //     ctx.scale(zoomRatio, zoomRatio);
        //     ctx.translate(-translateX, -translateY);

        //     return {
        //         px: px,
        //         py: py,
        //         x: px + lengthX,
        //         y: py + lengthY,
        //         zoom: newZoom,
        //         prevX: prev.x,
        //         prevY: prev.y,
        //         prevZoom: prev.zoom,
        //     }
        // });
    
        let prev = cameraPos;
        let newZoom = prev.zoom + delta;
        newZoom = Math.min( newZoom, MAX_ZOOM );
        newZoom = Math.max( newZoom, MIN_ZOOM );

        let zoomRatio = newZoom / prev.zoom;

        let lengthX = (prev.x - px) * (zoomRatio);
        let lengthY = (prev.y - py) * (zoomRatio);

        // Zoom on ctx
        let ctx = canvasRef.current.getContext('2d');
        let translateX = (px - prev.x) / prev.zoom;
        let translateY = (py - prev.y) / prev.zoom;
        
        ctx.translate(translateX, translateY);
        ctx.scale(zoomRatio, zoomRatio);
        ctx.translate(-translateX, -translateY);

        cameraPos = {
            px: px,
            py: py,
            x: px + lengthX,
            y: py + lengthY,
            zoom: newZoom,
            prevX: prev.x,
            prevY: prev.y,
            prevZoom: prev.zoom,
        }
        render();
    }

    const isInsideCv = (px, py, x1, x2, y1, y2) => {
        return (
            px > x1 && px < x2 && py > y1 && py < y2
        )
    }

    const onMouseDown = (e) => {
        let cvPX = viewport2canvasX(e.clientX);
        let cvPY = viewport2canvasY(e.clientY);

        let activeTile = null;
        tiles.map(tile => {
            if (tile.isInside(cvPX, cvPY)) {
                // Handle overlap case
                activeTile = activeTile?.zIndex > tile.zIndex ? activeTile : tile;
            }
        });

        if (activeTile) {
            activeTile.onMouseDown(cvPX, cvPY);
            activeTile.zIndex = Math.max(...tiles.map(t => t.zIndex)) + 1;
        }
        render();
    }

    const onMouseMove = (e) => {
        let cvPX = viewport2canvasX(e.clientX);
        let cvPY = viewport2canvasY(e.clientY);

        // Move tile if draggin & Attach add button to hovered tile
        let hoveredTile = null
        let aTileDragged = false;

        tiles.map(tile => {
            // Move Tile
            aTileDragged = aTileDragged || tile.onMouseMove(cvPX, cvPY);

            // Check if addButton should be attached
            if (tile === selectedTile || 
                (!tile.drag && isInsideCv(
                    cvPX, cvPY, tile.x, tile.x + tile.width, tile.y, 
                    tile.y + tile.height + addButton.marginTop + addButton.height * 1.5
                ))
            ) {
                // Handle overlap case
                hoveredTile = hoveredTile?.zIndex > tile.zIndex ? hoveredTile: tile;
            }
        });

        let addButtonOldState = addButton.display;

        // Only attach if a tile is not currently being dragged or covered
        if (hoveredTile && !aTileDragged) {
            addButton.attachTo(hoveredTile);

        } else {
            addButton.detach();
        }
        
        // Undo attachment if addButton space is being covered by another tile
        if (addButton.display) {
            let covered = false;
            tiles.map(tile => {
                if (tile !== hoveredTile) {
                    covered = covered || (
                        tile.zIndex > hoveredTile.zIndex && (
                            tile.isInside(addButton.x, addButton.y) ||
                            tile.isInside(addButton.x + addButton.width, addButton.y) ||
                            tile.isInside(addButton.x, addButton.y + addButton.height) ||
                            tile.isInside(addButton.x + addButton.width, addButton.y + addButton.height)
                        )
                    )
                }
            });
            if (covered) {
                addButton.detach();
            }
        }
        let addButtonNewState = addButton.display;

        if (addButtonOldState !== addButtonNewState || aTileDragged) {
            render();
        }

        // change mouse to pointer
        if (addButton.isInside(cvPX, cvPY) || 
            (tiles.map(t => (t.controls.insideCircle(cvPX, cvPY) || t.controls.insideSquare(cvPX, cvPY)))
                .reduce((next, curr) => next || curr, false))) {
            setPointer(true);
        } else {
            setPointer(false);
        }
    }

    const onMouseUp = (e) => {

        tiles.map(tile => {
            tile.onMouseUp();
        })
    }

    const onMouseClick = (e) => {
        let cvPX = viewport2canvasX(e.clientX);
        let cvPY = viewport2canvasY(e.clientY);

        tiles.map(tile => {
            tile.onMouseClick(cvPX, cvPY);
            if (tile.delete) {
                if (addButton.tile === tile) {
                    addButton.detach();
                }
                tiles.splice(tiles.indexOf(tile), 1);
                render();
            }
        });

        // Handle addButton
        if (addButton.isInside(cvPX, cvPY)) {

            tiles.push(new Tile(
                    addButton.tile.x,
                    addButton.tile.y + addButton.tile.height + tileMargin,
                    tileWidth, 
                    tileHeight, 
                    startCoding, 
                    Math.max(...tiles.map(t => t.zIndex)) + 1
            ));
            render();
        }
    }

    const render = () => {
        let ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(
            -cameraPos.x / cameraPos.zoom, 
            -cameraPos.y / cameraPos.zoom, 
            canvasWidth / cameraPos.zoom, 
            canvasHeight / cameraPos.zoom
        );
        canvasRef.current.style.backgroundColor = ('yellow');

        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw tiles layered by z indices
        tiles.sort((a, b) => a.zIndex - b.zIndex);
        tiles.map(tile => {
            tile.draw(ctx);
        })

        // Draw add button
        addButton.draw(ctx);
    }

    useLayoutEffect(() => {
        let canvas = canvasRef.current;
        let ctx = canvas.getContext('2d');
        let editor = editorRef.current;

        // Adjust for pixel ratio
        if (window.devicePixelRatio > 1) {
            canvas.width = canvasWidth * window.devicePixelRatio;
            canvas.height = canvasHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
        
        const handleWheelEvent = (e) => {
            e.preventDefault();
            if (e.ctrlKey) {
                adjustZoom(e.clientX, e.clientY, -e.deltaY * SCROLL_SENSITIVITY);
            }
            else {
                panCanvas(-e.deltaX * PAN_SENSITIVITY, -e.deltaY * PAN_SENSITIVITY);
            }
        };
    
        canvas.addEventListener('wheel', handleWheelEvent);
        editor.addEventListener('wheel', handleWheelEvent);

        return () => {
          canvas.removeEventListener('wheel', handleWheelEvent);
        };
    }, []);

    useEffect(() => {
        render();
    }, [cameraPos]);

    const canvasStyle = {
        position: 'fixed',
        left: 0,
        top: 0,
        width: canvasWidth,
        height: canvasHeight,
    }

    return(
        <>
            <canvas
                ref = {canvasRef}
                width = {canvasWidth}
                height = {canvasHeight}
                onMouseDown = {onMouseDown}
                onMouseUp = {onMouseUp}
                onMouseMove = {onMouseMove}
                onClick = {onMouseClick}
                style = {canvasStyle}
            />
            <CodeEditor
                ref = {editorRef}
                selectedTile = {selectedTile}
                setSelectedTile = {setSelectedTile}
                cameraPos = {cameraPos}
                canvas2viewportX = {canvas2viewportX}
                canvas2viewportY = {canvas2viewportY}
                render = {render}
            />
        </>
    )

}