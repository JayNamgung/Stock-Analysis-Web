import React from 'react';
import { MantineProvider } from '@mantine/core';
import CompanyManagement from './features/company/CompanyManagement';

function App() {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <div className="App">
        <CompanyManagement />
      </div>
    </MantineProvider>
  );
}

export default App;