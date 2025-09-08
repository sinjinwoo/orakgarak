import React from 'react';
import { AppProviders } from './app/AppProviders';
import { AppRouter } from './app/router';
import './app/index.css';

function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}

export default App;
