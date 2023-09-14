import { useState } from 'react';
import {Routes, Route} from 'react-router-dom';
import CanvasPortal from './componenets/CanvasPortal';
import EditorPortal from './componenets/EditorPortal';
import Colors from './componenets/Colors';



export default function App() {
  return (
    <Routes>
      <Route index element = {<CanvasPortal />} />
      <Route path= "/editor" element={<EditorPortal />} />
      <Route path= "/colors" element={<Colors />} />
    </Routes>
  )
};