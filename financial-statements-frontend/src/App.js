import React, { useState } from 'react';
import SearchComponent from './features/search/SearchComponent';
import UpdateButton from './component/UpdateButton';
import './App.css';

function App() {
  const [isUpdating, setIsUpdating] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <h1>SeeStock</h1>
        <div className="search-and-update">
          <SearchComponent />
          <UpdateButton isUpdating={isUpdating} setIsUpdating={setIsUpdating} />
        </div>
      </header>
    </div>
  );
}

export default App;