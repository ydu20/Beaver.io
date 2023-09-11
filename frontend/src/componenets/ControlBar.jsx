import {useState, useEffect} from 'react';
import './ControlBar.css';

export default function ControlBar() {

    const [live, setLive] = useState(false);

    const startEnv = () => {
        if (window.startJupyterEnv) {
            window.startJupyterEnv();
        }
    }

    useEffect(() => {
        window.setControlBarStatus = (live) => {
            setLive(live);
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
    </div>
    )
}