import {useState, useEffect} from 'react';
import './ControlBar.css';

export default function ControlBar() {

    const [live, setLive] = useState(false);
    const [saveStatus, setSaveStatus] = useState("");

    const startEnv = () => {
        if (window.startJupyterEnv) {
            window.startJupyterEnv();
        }
    }
    const cleanUp = () => {
        if (window.cleanUpTiles) {
            window.cleanUpTiles();
        }
    }

    const loadFromFile = async () => {
        let [fileHandle] = await window.showOpenFilePicker({
            types: [{
                description: 'Jupyter Notebook',
                accept: {
                    'application/x-ipynb+json': ['.ipynb']
                }
            }],
        });
        let fileData = await fileHandle.getFile();
        let fileText = await fileData.text();
        let fileJson = JSON.parse(fileText);

        if (window.loadFromFile) {
            window.loadFromFile(fileJson);
        }
    }

    useEffect(() => {
        window.setControlBarStatus = (status) => {
            setLive(status);
        }

        window.setSaveStatus = (status) => {
            setSaveStatus(status);
        }

        return () => {
            window.setControlBarStatus = null;
        }
    }, []);

    return (
    <div className = 'cb-container'>
        <div 
            className = 'cb-indicator'
            style = {{color: live ? 'green' : 'red'}}
        >
            •
        </div>
        <button 
            className = 'cb-button'
            onClick = {startEnv}
        >
            ▶
        </button>
        <button className = 'cb-button'>
            ■
        </button>
        <button 
            className = 'cb-button'
            onClick = {cleanUp}
        >
            Clean Up
        </button>
        <button
            className = 'cb-button'
            onClick = {loadFromFile}
        >
            Load from File
        </button>
        <div>
            {saveStatus}
        </div>
    </div>
    )
}