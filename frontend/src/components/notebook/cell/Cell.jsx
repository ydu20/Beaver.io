import React, {useCallback, useRef, useEffect, useState} from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import {Paper, Box, Card, CardContent, Button } from '@mui/material';
import Editor from '@monaco-editor/react';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import DeleteIcon from '@mui/icons-material/Delete';



function Cell({id, deleteCell, kernelConnection, startEnv, setContentParent, setBusy}) {

    // ********************* Variables & Functions **********************

    const monacoRef = useRef(null);
    const containerRef = useRef(null);
    // const [isCode, setIsCode] = useState(true);
    const [runStatus, setRunStatus] = useState(' ');
    const [focus, setFocus] = useState(0);
    // 0 = not highlighted, 1 = outer highlight, 2 = editing
    // const [busy, setBusy] = useState(false);


    const [content, setContent] = useState("");
    const [output, setOutput] = useState("");



    useEffect(() => {
        monacoRef?.current?.addAction({
            id: 'run-cell',
            label: 'Run Cell Action',
            keybindings: [2048 | 3, 1024 | 3],
            run: (ed) => runCell(ed.getValue()),
        });
    }, [kernelConnection]);

    const runCell = (code) => {
        console.log("RUNNING CELL...");

        console.log(code);
        console.log(kernelConnection);
        if (kernelConnection === null) {
            startEnv()
                .then(kernelConnection => {
                    sendExecuteRequest(kernelConnection, code);
                })
                .catch(err => {
                    console.log(err);
                })
        } else {
            sendExecuteRequest(kernelConnection, code);
        }
    };


    const sendExecuteRequest = (kc, code) => {
        
        if (code.trim() !== '') {

            console.log("SENDING EXECUTE REQUEST...");

            setRunStatus('*');
            setOutput("");
            const future = kc.requestExecute({ code: code });

            future.onIOPub = msg => {
                if (msg.header.msg_type === 'stream') {
                    setOutput(prev => prev + msg.content?.text);
                }
                if (msg.header.msg_type === 'execute_result') {
                    console.log(msg);
                    setOutput(prev => prev + msg.content.data['text/plain']);
                }
            };

            future.done
                .then(reply => {
                    console.log(reply.content);
                    if (reply.content.status === 'error') {
                        setOutput(prev => prev + `${reply.content.ename}: ${reply.content.evalue}`);
                    }
                    setRunStatus(reply.content.execution_count);
                })
                .catch(err => {
                    console.log(err);
                })
        } else {
            setOutput("");
        }
    }


    const handleEditorDidMount = (editor, monaco) => {
        monacoRef.current = editor;
        adjustEditorHeight();


        monaco.editor.defineTheme('custom', {
          base: 'vs',
          inherit: true,
          rules: [

          ],
          colors: {
            'editorGutter.background': '#f0f0f0',
          }
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | 36, function() {}, "");

        editor.addAction({
            id: 'run-cell',
            label: 'Run Cell Action',
            keybindings: [2048 | 3, 1024 | 3],
            run: (ed) => runCell(ed.getValue()),
        });
    }

    const switchFocus = () => {
        containerRef.current.focus();
    }

    const handleEditorChange = (text, e) => {
        adjustEditorHeight();
        debouncedOnEdit(text);
    }

    const debouncedOnEdit = debounce(setContent, 200);


    const adjustEditorHeight = () => {
        if (monacoRef.current) {
            const contentHeight = monacoRef.current.getContentHeight();
            monacoRef.current.layout({
            height: contentHeight,
            width: monacoRef.current.getLayoutInfo().width
            });
        }
    }

    const handleContainerFocus = () => {
        setFocus(1);
    }
    
    const handleContainerBlur = () => {
        setFocus(0);
    }

    const handleEditorFocus = (e) => {
        e.stopPropagation();
        setFocus(2);
    }

    const handleEditorBlur = () => {
        setFocus(0);
    }

    
    // ********************* Styling **********************

    useEffect(() => {
        const handleResize = () => {
            if (monacoRef.current && containerRef.current) {
            monacoRef.current.layout({width: containerRef.current.offsetWidth - 60});
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const cellPaperStyle = {
        padding: '15px 15px 15px 15px',
        minHeight: '20px',
        position: 'relative',
        ':focus-visible': {
            // outline: 'none'
        },
        outline: (focus === 1) ? '#03a9f4 solid 1px' : 
            (focus === 2) ? '#4caf50 solid 1px' : 'none',
        marginBottom: '14px',
    }

    const cellWrapperStyle = {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
    }

    const buttonsPaneStyle = {
        position: 'absolute',
        display: focus !== 0 ? 'flex' : 'none',
        flexDirection: 'row',
        justifyContent: 'space-between',
        top: '-11px',
        right: '10px',
        width: '47px',
        padding: '2px 4px 2px 4px',
    }

    const iconStyle = {
        color: '#919191',
        height: '16px',
        width: '18px',
        cursor: 'pointer',
    }

    const outputStyle = {
        fontFamily: 'Monaco, monospace',
        fontSize: '14px',
        marginBottom: '10px',
        marginLeft: '5px',
    }

  return (
        <Box>
            <Paper 
                sx = {cellPaperStyle}
                ref = {containerRef}
                tabIndex="0" 
                onFocus = {handleContainerFocus}
                onBlur = {handleContainerBlur}
            >
                <Box sx = {cellWrapperStyle}>
                    <Box 
                        width = '20px' 
                        whiteSpace='pre'
                        lineHeight= '15px'
                        fontSize = '12px'
                        marginRight= '10px'
                        fontFamily = 'Monaco, monospace'
                    >
                        [<span style = {{verticalAlign: 
                            runStatus === '*' ? '-3px': '0px'}}>
                            {runStatus}
                        </span>]
                    </Box>
                    <Box 
                        width = "100%"
                        tabIndex="0"
                        flex = {1}
                        onFocus = {handleEditorFocus}
                        onBlur = {handleEditorBlur}
                    >
                        <Editor
                            defaultLanguage = "python"
                            theme = 'vs-light'
                            options = {{
                                minimap: {enabled: false},
                                scrollBeyondLastLine: false,
                                lineNumbersMinChars: 3,
                                find: {enabled: false},
                            }}
                            value = {content}
                            onMount = {handleEditorDidMount}
                            onChange = {handleEditorChange}
                        />
                    </Box>

                    <Paper sx = {buttonsPaneStyle}>
                        <PlayCircleIcon style = {iconStyle} onClick = {() => runCell(content)}/>
                        <DeleteIcon style = {iconStyle} onClick = {() => deleteCell(id)}/>
                    </Paper>  
                </Box>
            </Paper>
            <Box style = {outputStyle}>
                <pre>
                    {output}
                </pre>
            </Box>
        </Box>

    );
}

export default Cell;
