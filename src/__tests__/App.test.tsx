import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import App from '../App';

jest.mock('electron', () => {
  const mElectron = {
    ipcRenderer: {
      on: jest.fn(),
      send: jest.fn(),
      sendSync: jest.fn(),
    },
    remote: { getGlobal: jest.fn() },
  };
  return mElectron;
});

// Partial mock example
// https://jestjs.io/docs/mock-functions#mocking-partials
// jest.mock('../DataStore', () => {
//   const originalModule = jest.requireActual('../DataStore');

//   // Mock the default export and named export Collection
//   return {
//     __esModule: true,
//     Collection: [],
//     ...originalModule,
//     default: () => {
//       return { getAll: () => [] };
//     },
//   };
// });

describe('App', () => {
  it('should render', () => {
    expect(render(<App />)).toBeTruthy();
  });
});
