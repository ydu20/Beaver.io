import {Paper, Box, Card, CardContent, Button } from '@mui/material';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import AddCircleIcon from '@mui/icons-material/AddCircle';

function Toolbar({startEnv}) {
    
    const buttonsPaneStyle = {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '47px',
        padding: '2px 4px 2px 4px',
    }

    const iconStyle = {
        color: '#919191',
        height: '16px',
        width: '18px',
        cursor: 'pointer',
    }

    return (
        <Paper sx = {buttonsPaneStyle}>
            <PlayCircleIcon style = {iconStyle} onClick = {startEnv}/>
            <AddCircleIcon style = {iconStyle}/>
        </Paper>  
    )
}


export default Toolbar;