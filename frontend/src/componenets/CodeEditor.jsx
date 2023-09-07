import {useRef, useEffect, useState, forwardRef} from 'react';



const CodeEditor = forwardRef(({
        selectedTile, 
        setSelectedTile, 
        cameraPos,
        canvas2viewportX, 
        canvas2viewportY, 
        render,
    }, editorRef) => {

    const [code, setCode] = useState('');

    const editorStyle = {
        position: 'fixed',
        left: selectedTile ? canvas2viewportX(selectedTile.x + selectedTile.innerMarginSide) : 0,
        top: selectedTile ? canvas2viewportY(selectedTile.y + selectedTile.innerMarginTop) : 0,
        width: selectedTile ? (selectedTile.width - selectedTile.innerMarginSide * 2) : 0,
        transform: `scale(${cameraPos.zoom}, ${cameraPos.zoom})`,
        transformOrigin: 'top left',
        zIndex: 2,
        resize: 'none',
        display: selectedTile? 'block' : 'none',
        overflowY: 'hidden',
        pre: {
            '-moz-tab-size' : 4,
              '-o-tab-size' : 4,
                 'tab-size' : 4,
        },
    }

    const endCoding = (e) => {
        setSelectedTile(prev => {
            prev.code = code;
            render();
            return null;
        });
    }

    useEffect(() => {
        if (selectedTile && editorRef.current) {
            setCode(selectedTile.code);
            editorRef.current.focus();
        }
    }, [selectedTile])

    useEffect(() => {
        if (selectedTile && editorRef.current) {
            adjustHeight();
        }
    }, [code]);

    const adjustHeight = () => {
        let oldHeight = selectedTile.editorHeight;
        editorRef.current.style.height = 'auto';
        editorRef.current.style.height = `${editorRef.current.scrollHeight}px`;
        selectedTile.setEditorHeight(editorRef.current.scrollHeight);

        if (oldHeight !== selectedTile.editorHeight) {
            render();
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            insertTab();
        }
    }

    const insertTab = () => {
        let cursorPos = editorRef.current.selectionStart;
        let beforeCursor = code.slice(0, cursorPos);
        let afterCursor = code.slice(cursorPos);

        let tabChar = '\t';
        setCode(beforeCursor + tabChar + afterCursor);

        setTimeout(() => {
            editorRef.current.selectionStart = cursorPos + tabChar.length;
            editorRef.current.selectionEnd = cursorPos + tabChar.length;
        })
    }

    return(
        <textarea
                ref = {editorRef}
                onBlur = {endCoding}
                style = {editorStyle}
                value = {code}
                onChange = {(e) => {setCode(e.target.value)}}
                onKeyDown = {handleKeyDown}
        />
    )
});

export default CodeEditor;