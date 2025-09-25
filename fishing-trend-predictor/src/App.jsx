import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import LogCatchForm from "./components/LogCatchForm";

function App() {
  return (
    <div className="App">
      <h1>🎣 Fishing Tracker</h1>
      <LogCatchForm />
    </div>
  );
}

export default App;
