import { useState } from 'react';
import {Routes, Route} from 'react-router-dom';
import Home from './componenets/Home';


export default function App() {
  return (
    <Routes>
      <Route index element = {<Home />} />
    </Routes>
  )
};