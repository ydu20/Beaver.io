import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom';
import {ThemeProvider, CssBaseline} from '@mui/material';
import theme from './theme.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ThemeProvider theme = {theme}>
      <CssBaseline/>
      <App/>
    </ThemeProvider>
  </BrowserRouter>
)
