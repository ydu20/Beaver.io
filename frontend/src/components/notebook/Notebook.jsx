import {useRef, useEffect, useState} from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Box, CardContent, Button } from '@mui/material';
import Toolbar from './ToolBar';
import axios from 'axios';
import Cell from './cell/Cell';

import {
    KernelManager,
    KernelConnection,
    Session,
    SessionAPI,
    KernelMessage,
    KernelAPI,
    SessionManager,
    ServerConnection,
} from '@jupyterlab/services';

function Notebook() {


    const [kernelConnection, setKernelConnection] = useState(null);


    useEffect(() => {

        // temp()

        // const serverSettings = ServerConnection.makeSettings({
        //     baseUrl: 'http://localhost:8080', // This should point to your Jupyter server's URL
        //     wsUrl: 'ws://localhost:8080',     // WebSocket URL, required for kernels to work
        //     token: 'cbee613476ab2785b0e6e9c312068fcfef8937e7df828c23'               // If you have token-based authentication enabled
        // });

        // const kernelManager = new KernelManager({serverSettings: serverSettings});

        
        // kernelManager.startNew().then(kernel => {
        //     console.log("STARTED!!!");

        //     // sK(kernel)


        // }).catch(error => {
        //     console.error("ERRORRRRRR NOOOOOOOOO: ", error);
        // })
    }, [])

    const temp = async () => {

        const serverSettings = ServerConnection.makeSettings({
            baseUrl: 'http://localhost:8080', // This should point to your Jupyter server's URL
            wsUrl: 'ws://localhost:8080',     // WebSocket URL, required for kernels to work
            token: 'b6d2e4a8fb610874bb3e9181488c1920a5340da2eb6c685e'               // If you have token-based authentication enabled
          });

        // Start a python kernel
        const kernelManager = new KernelManager({serverSettings: serverSettings});
        const kernel = await kernelManager.startNew();

        // Register a callback for when the kernel changes state.
        kernel.statusChanged.connect((_, status) => {
        console.log(`Status: ${status}`);
        });
        console.log(kernel)

        console.log('Executing code');
        const future = kernel.requestExecute({ code: 'a = 1' });
        // Handle iopub messages
        future.onIOPub = msg => {
        if (msg.header.msg_type !== 'status') {
            console.log(msg.content);
        }
        };
        await future.done;
        console.log('Execution is done');

        // console.log('Send an inspect message');
        // const request = {
        // code: 'hello',
        // cursor_pos: 4,
        // detail_level: 0
        // };
        // const inspectReply = await kernel.requestInspect(request);
        // console.log('Looking at reply');
        // if (inspectReply.content.status === 'ok') {
        // console.log('Inspect reply:');
        // console.log(inspectReply.content.data);
        // }

        // console.log('Interrupting the kernel');
        // await kernel.interrupt();

        // console.log('Send an completion message');
        // const reply = await kernel.requestComplete({ code: 'impor', cursor_pos: 4 });
        // if (reply.content.status === 'ok') {
        // console.log(reply.content.matches);
        // }

        // console.log('Restarting kernel');
        // await kernel.restart();

        // console.log('Shutting down kernel');
        // await kernel.shutdown();

        // console.log('Finding all existing kernels');
        // const kernelModels = await KernelAPI.listRunning();
        // console.log(kernelModels);
        // if (kernelModels.length > 0) {
        // console.log(`Connecting to ${kernelModels[0].name}`);
        // kernelManager.connectTo({ model: kernelModels[0] });
        // }
        
    }


    // const exeHello = () => {
    //     const future = k.requestExecute({ code: 'print("HELLO")' });

    //     console.log(future);

    //     future.done
    //     .then(() => {
    //         console.log('Execution is done');
    //     })
    //     .catch(error => {
    //         console.log('Error during execution:', error);
    //     });
    // }
    

    const [cells, setCells] = useState([{num:' ', content:'', output:{}}]);
    
    const baseURL = 'http://localhost:8080/api';
    const token = 'b570ac2ee533ac355a3464c2bc99c6daf45ad6c68d691d93';
    const headers = { 'Authorization': `token ${token}` }
    const [kernel, setKernel] = useState('');
    const [socketURL, setSocketURL] = useState(null);


    const [messageHistory, setMessageHistory] = useState([]);

    const {sendMessage, lastMessage, readyState} = useWebSocket(socketURL, {
        shouldReconnect: (closeEvent) => true,
    });


    const uuid = require('uuid');

    useEffect(() => {
        if (lastMessage !== null) {
            console.log(lastMessage.data);
            setMessageHistory((prev) => prev.concat(lastMessage));
        
        }
    }, [lastMessage]);
    

    const editCells = (ind, key, val) => {
        console.log("editing")
        setCells(prev => prev.map((c, i) =>
            i === ind ? {...c, [key]: val} : c
        ))
    }

    const startEnv = (code) => {
        axios.post(`${baseURL}/kernels`, {}, {withCredentials: true, headers: headers})
        .then(res => {
            console.log(res.data)
            setKernel(res.data.id);
            setSocketURL(`ws://localhost:8080/api/kernels/${res.data.id}/channels?token=${token}`);
            if (code) {
                sendExecuteRequest(code);
            }
        })
        .catch(err => {
            console.log(`Error: ${err.message}`);
            setKernel('');
        })
    }

    const runCell = async (ind) => {
        console.log('checkpoint 1');
        if (kernel === '') {
            console.log('kernel empty');
            startEnv(cells[ind].content);
        } else {
            console.log(kernel);
            sendExecuteRequest(cells[ind].content);
        }


    }

    const sendExecuteRequest = (code) => {
        console.log(code);
        console.log(readyState);
        
        switch (readyState) {
            case WebSocket.CONNECTING:
                console.log('connecting')
                break;
            case WebSocket.OPEN:
                console.log('open')
                break;
            case WebSocket.CLOSING:
                console.log('closing')
                break;
            case WebSocket.CLOSED:
                console.log('closed')
                break;
            default:
                console.log('??')
                break;
        }


        if (code.trim() !== '') {
            sendMessage(JSON.stringify(generateExecuteRequest(code)));
        }
    }

    
    const generateExecuteRequest = (code) => {
        const msgType = 'execute_request';
        const content = {
            code: code,
            silent: false,
            allow_stdin: false,
        };

        const hdr = {
            msg_id: uuid.v1(),
            username: 'test',
            session: uuid.v1(),
            data: new Date().toISOString(),
            msg_type: msgType,
            version: '5.0'
        };

        const msg = {
            header: hdr,
            parent_header: hdr,
            metadata: {},
            content: content
        };

        return msg;
    }



    const tempStyle = {
        padding: '200px 300px 200px 300px',
        // backgroundColor: 'red',
    }

    const addCell = () => {
        setCells(prev => [...prev, {num:' ', content:'', output:{}}])
    }
    

    return (
        <>
            <Box sx = {tempStyle}>
                <Toolbar startEnv = {startEnv}/>
                <Box marginTop = '20px'>
                    {cells.map((c, i) => (
                        <Cell 
                            cells = {cells} 
                            editCells = {editCells} 
                            ind = {i} 
                            key = {i}
                            runCell = {runCell}
                        />
                    ))}
                </Box>
                <Button onClick = {startEnv}>
                    Add Cell
                </Button>
            </Box>
        </>
    )
}


export default Notebook;