import {useEffect, useRef} from 'react';
import MainCanvas from './canvas_package/MainCanvas';
import ControlBar from './ControlBar';

export default function CanvasPortal() {

    const canvasRef = useRef(null);
    // const editorRef = useRef(null);
    const editorContainerRef = useRef(null);

    useEffect(() => {
        let canvas = canvasRef.current;
        // let editor = editorRef.current;
        let editorContainer = editorContainerRef.current;

        // Initialize canvas;
        let mainCanvas = new MainCanvas(canvas, editorContainer, window);

        // Mouse, wheel listeners
        canvas.addEventListener('click', (e) => mainCanvas.onClick(e));
        canvas.addEventListener('mousedown', (e) => mainCanvas.onMouseDown(e));
        canvas.addEventListener('mouseup', (e) => mainCanvas.onMouseUp(e));
        canvas.addEventListener('mousemove', (e) => mainCanvas.onMouseMove(e));
        canvas.addEventListener('wheel', (e) => mainCanvas.onWheel(e));
        
        editorContainer.addEventListener('wheel', (e) => mainCanvas.onWheel(e));

        return (() => {
            mainCanvas.destroy();
        })
    }, [])

    return (
        <>
            <canvas
                ref = {canvasRef}
            />
            {/* <textarea 
                ref = {editorRef}
            /> */}
            <div
                ref = {editorContainerRef}
            />
            <ControlBar/>
        </>
    )
  
}