import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import Hud from '../components/Hud';
import { startServer } from '../utils';

describe('Hud', () => {
  it('should render', () => {
    act(() => {
      expect(render(<Hud />)).toBeTruthy();
    });
  });
});
