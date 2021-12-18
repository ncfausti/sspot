import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import App from '../App';

describe('App', () => {
  it('should start the ws_server from main via ipc call', () => {
    expect(1).toEqual(2);
  });

  // since we can now reset the state of the server easily,
  // we should create the server on app start, then reset it
  // when the user clicks Launch SaleSpot, eliminating the need for
  // the loading screen prior to the HUD starting
  it('should start the ws_server from main via ipc call', () => {
    expect(1).toEqual(2);
  });

  it('should render', () => {
    expect(render(<App />)).toBeTruthy();
  });

  it('should render with snapshot', () => {
    expect(render(<App />)).toMatchSnapshot();
  });

  it('should start the python server', () => {
    expect(1).toEqual(2);
  });

  it('should start the pymouse listener', () => {
    expect(1).toEqual(2);
  });

  it('should guarantee that pymouse listener can only be registered once', () => {
    expect(1).toEqual(2);
  });
});
