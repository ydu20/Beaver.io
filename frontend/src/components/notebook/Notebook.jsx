import {useRef, useEffect, useState} from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Box, CardContent, Button, tableCellClasses } from '@mui/material';
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

    // Reverse proxy at 8080
    const baseUrl = 'http://localhost:8080';
    const ws = 'ws://localhost:8080';
    const token = 'e99fe87a2463835166679f2bf9b2071c4de2e503ac984921';
    const [cells, setCells] = useState([{id: 0, content:''}]);
    const [nextId, setNextId] = useState(1);

    
    const serverSettings = ServerConnection.makeSettings({
        baseUrl: baseUrl,
        wsUrl: ws,
        token: token
    });
    const kernelManager = new KernelManager({serverSettings: serverSettings});
    const [kernelConnection, setKernelConnection] = useState(null);

    const editCells = (ind, key, val) => {
        setCells(prev => prev.map((c, i) =>
            i === ind ? {...c, [key]: val} : c
        ))
    }

    const addCell = () => {
        setCells(prev => [...prev, {id: nextId, content:''}]);
        setNextId(prevId => prevId + 1);
    }

    const deleteCell = (id) => {
        console.log(cells)
        setCells(prev => prev.filter(cell => cell.id !== id));
        console.log(cells)
    }


    const startEnv = () => {
        return new Promise((resolve, reject) => {
            if (kernelConnection === null) {
                console.log("STARTING KERNEL CONNECTION......");
    
                kernelManager.startNew().then(kc => {
                    console.log("Kernel connection started!!!");
                    console.log(kc);
    
                    // kc.statusChanged.connect((_, status) => {
                    //     console.log(`Status: ${status}`);
                    // });
    
                    setKernelConnection(kc);
                    resolve(kc);
                }).catch(err => {
                    reject(err);
                })
            } else {
                resolve(kernelConnection);
            }
        });
    };


    return (
        <>
                <Toolbar startEnv = {startEnv} addCell = {addCell} kernelConnection = {kernelConnection}/>
                <Box marginTop = '20px'>
                    {cells.map((c, i) => (
                        <Cell 
                            key = {c.id}
                            id = {c.id}
                            kernelConnection = {kernelConnection}
                            startEnv = {startEnv}
                            deleteCell = {deleteCell}
                            setContentParent = {editCells}
                        />
                    ))}
                </Box>
                <Button onClick = {addCell}>
                    Add Cell
                </Button>
        </>
    )
}


export default Notebook;