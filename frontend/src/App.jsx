import {Routes, Route} from 'react-router-dom';
import Notebook from './components/notebook/Notebook';

function App() {
  return (
    <Routes>
      <Route index element={<Notebook />}/>
    </Routes>
  );
}

export default App;
