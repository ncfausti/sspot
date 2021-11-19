import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { Request } from 'zeromq';
import { spawn } from 'child_process';
import path from 'path';
import log from 'electron-log';
import Hud from '../components/Hud';
import { startServer } from '../utils';

describe('Hud', () => {
  it('should render', () => {
    expect(render(<Hud />)).toBeTruthy();
  });
});

describe('Zeromq socket tests', () => {
  it('should start the python spotting server', () => {
    const pythonServerBin =
      process.platform === 'darwin' ? 'ws_server' : 'ws_server.exe';
    const assets = path.join(process.cwd(), 'assets');
    const binDir = path.join(assets, 'ws_server');
    process.chdir(binDir);

    const child = spawn(`./${pythonServerBin}`);
    expect(child.pid).toBeGreaterThan(-1);
    child.kill(9);

    const server = startServer();
    expect(server.pid).toBeGreaterThan(-1);
  });

  it('should kill the server process by name with pkill', () => {});

  it('should connect to the python spotting server', () => {
    const sock = new Request();
    sock.connect('tcp://localhost:5555');
    expect(sock.readable).toBeTruthy();
  });

  it('should disconnect from the python spotting server', () => {
    const sock = new Request();
    sock.connect('tcp://localhost:5555');
    sock.disconnect('tcp://localhost:5555');
  });
});
