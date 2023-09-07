import { useState } from 'react';
import {Routes, Route} from 'react-router-dom';
import MainCanvas from './componenets/MainCanvas';


export default function App() {
  return (
    <Routes>
      <Route index element = {<MainCanvas />} />
    </Routes>
  )
};