import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import Hud, { removeItemById } from '../components/Hud/Hud';

jest.mock('electron', () => {
  const mElectron = {
    ipcRenderer: {
      on: jest.fn(),
      send: jest.fn(),
      sendSync: jest.fn(),
    },
    remote: {
      getGlobal: jest.fn(),
      getCurrentWindow: jest.fn(),
    },
  };
  return mElectron;
});

jest.mock('events', () => {
  const emitter = jest.fn();
  emitter.send = jest.fn();
  emitter.setConfig = jest.fn();
  return emitter;
});

describe('Hud', () => {
  it('should render', () => {
    expect(render(<Hud />)).toBeTruthy();
  });

  it('should remove item by id', () => {
    const faces = [
      { id: 1, name: 'test', image: 'test' },
      { id: 2, name: 'test', image: 'test' },
      { id: 3, name: 'test', image: 'test' },
    ];

    const faces2 = [
      { id: 'a', name: 'test', image: 'test' },
      { id: 'b', name: 'test', image: 'test' },
      { id: 'c', name: 'test', image: 'test' },
    ];

    expect(removeItemById(3, faces)).toEqual([
      { id: 1, name: 'test', image: 'test' },
      { id: 2, name: 'test', image: 'test' },
    ]);
    expect(removeItemById('a', faces2)).toEqual([
      { id: 'b', name: 'test', image: 'test' },
      { id: 'c', name: 'test', image: 'test' },
    ]);
    expect(removeItemById('9', faces2)).toEqual(faces2);
  });
});
