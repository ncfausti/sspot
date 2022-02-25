import React from 'react';
import { render } from '@testing-library/react';
import Release from '../components/Release/Release';

it('should render', () => {
  expect(render(<Release />)).toBeTruthy();
});
