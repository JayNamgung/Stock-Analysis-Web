import React from 'react';
import { MantineProvider, Grid } from '@mantine/core';
import CompanyManagement from './features/company/CompanyManagement';
import SearchComponent from './features/search/SearchComponent';

function App() {
  return (
    <MantineProvider 
      withGlobalStyles 
      withNormalizeCSS
      theme={{
        components: {
          Button: {
            styles: {
              rightIcon: { width: 16, height: 16 },
              leftIcon: { width: 16, height: 16 },
            },
          },
          ActionIcon: {
            styles: {
              root: { width: 16, height: 16 },
            },
          },
        },
      }}
    >
      <div className="App">
        <Grid>
          <Grid.Col span={6}>
            <CompanyManagement />
          </Grid.Col>
          <Grid.Col span={6}>
            <SearchComponent />
          </Grid.Col>
        </Grid>
      </div>
    </MantineProvider>
  );
}

export default App;