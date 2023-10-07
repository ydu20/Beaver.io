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
    }, [])

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
        <div>
            {saveStatus}
        </div>
    </div>
    )
}