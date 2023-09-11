import {useEffect, useRef} from 'react';
import MainCanvas from './canvas_package/MainCanvas';

export default function CanvasPortal() {

    const canvasRef = useRef(null);
    const editorRef = useRef(null);

    useEffect(() => {
        let canvas = canvasRef.current;
        let editor = editorRef.current;
        let dpr = window.devicePixelRatio;

        // Initialize canvas;
        let mainCanvas = new MainCanvas(canvas, editor, dpr);

        // Mouse, wheel listeners
        canvas.addEventListener('click', (e) => mainCanvas.onClick(e));
        canvas.addEventListener('mousedown', (e) => mainCanvas.onMouseDown(e));
        canvas.addEventListener('mouseup', (e) => mainCanvas.onMouseUp(e));
        canvas.addEventListener('mousemove', (e) => mainCanvas.onMouseMove(e));
        canvas.addEventListener('wheel', (e) => mainCanvas.onWheel(e));
        
        editor.addEventListener('wheel', (e) => mainCanvas.onWheel(e));
        editor.addEventListener('input', (e) => mainCanvas.codeEditor.onInput(e));
        editor.addEventListener('keydown', (e) => mainCanvas.codeEditor.onKeyDown(e));

    }, [])

    return (
        <>
            <canvas
                ref = {canvasRef}
            />
            <textarea 
                ref = {editorRef}
            />
        </>
    )
  
}