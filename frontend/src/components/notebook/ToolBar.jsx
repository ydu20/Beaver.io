import {Paper, Box, Card, CardContent, Button } from '@mui/material';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import AddCircleIcon from '@mui/icons-material/AddCircle';

function Toolbar({startEnv, addCell, kernelConnection}) {
    
    const buttonsPaneStyle = {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        // width: '47px',
        padding: '2px 4px 2px 4px',
    }

    const iconStyle = {
        color: '#919191',
        height: '16px',
        width: '18px',
        cursor: 'pointer',
    }

    const statusStyle = {
        marginTop: '2px',
        marginLeft: '3px',
        marginRight: '3px',
        lineHeight: '10px',
        fontSize: '7px',
        color: kernelConnection === null ? 'red' : 'green',
    }

    return (
        <Paper sx = {buttonsPaneStyle}>
            <Box style = {statusStyle}>⬤</Box>
            <PlayCircleIcon style = {iconStyle} onClick = {startEnv}/>
            <AddCircleIcon style = {iconStyle} onClick = {addCell}/>
        </Paper>
    )
}


export default Toolbar;