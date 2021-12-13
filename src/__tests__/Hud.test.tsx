import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import Hud, { removeItemById } from '../components/Hud';
import { startServer } from '../utils';

describe('Hud', () => {
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
