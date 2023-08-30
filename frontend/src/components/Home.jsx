import React from 'react';
import { Box } from '@mui/material';
import Notebook from './notebook/Notebook';
import Canvas from './Canvas';



function Home () {

    const tempStyle = {
        padding: '100px 200px 100px 200px',
    }

    return (
        <Box sx = {tempStyle}>
            {/* <Notebook/> */}
            <Canvas/>
        </Box>
    )
}

export default Home;