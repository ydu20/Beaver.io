import {useEffect, useRef} from 'react';
import MainCanvas from './canvas_package/MainCanvas';
import ControlBar from './ControlBar';

export default function CanvasPortal() {

    const canvasRef = useRef(null);
    const codeEditorContainerRef = useRef(null);
    const markdownEditorContainerRef = useRef(null);

    useEffect(() => {
        let canvas = canvasRef.current;
        let codeEditorContainer = codeEditorContainerRef.current;
        let markdownEditorContainer = markdownEditorContainerRef.current;

        // Initialize canvas;
        let mainCanvas = new MainCanvas(canvas, codeEditorContainer, markdownEditorContainer, window);

        // Mouse, wheel listeners
        canvas.addEventListener('click', (e) => mainCanvas.onClick(e));
        canvas.addEventListener('mousedown', (e) => mainCanvas.onMouseDown(e));
        canvas.addEventListener('mouseup', (e) => mainCanvas.onMouseUp(e));
        canvas.addEventListener('mousemove', (e) => mainCanvas.onMouseMove(e));
        canvas.addEventListener('wheel', (e) => mainCanvas.onWheel(e));
        
        codeEditorContainer.addEventListener('wheel', (e) => {mainCanvas.onWheel(e)});
        markdownEditorContainer.addEventListener('wheel', (e) => {mainCanvas.onWheel(e)});


        // Key listeners
        canvas.addEventListener('keydown', (e) => mainCanvas.onKeyDown(e));

        return (() => {
            mainCanvas.destroy();
        })
    }, [])

    return (
        <>
            <canvas
                ref = {canvasRef}
                tabIndex ="0"
            />
            <div
                ref = {codeEditorContainerRef}
            />
            <div
                ref = {markdownEditorContainerRef}
            />
            <ControlBar/>
        </>
    )
  
}