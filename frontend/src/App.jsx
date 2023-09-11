import { useState } from 'react';
import {Routes, Route} from 'react-router-dom';
import CanvasPortal from './componenets/CanvasPortal';


export default function App() {
  return (
    <Routes>
      <Route index element = {<CanvasPortal />} />
    </Routes>
  )
};