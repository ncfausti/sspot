import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { spawn } from 'child_process';
import path from 'path';
import log from 'electron-log';
import { start } from 'repl';
import Hud from '../components/Hud';
import { startServer } from '../utils';

describe('websocket processing server tests', () => {
  it('should start the python spotting server', async () => {
    const pythonServerBin =
      process.platform === 'darwin' ? 'ws_server' : 'ws_server.exe';
    const assets = path.join(process.cwd(), 'assets');
    const binDir = path.join(assets, 'ws_server');
    process.chdir(binDir);

    const child = await spawn(`./${pythonServerBin}`);
    expect(child.pid).toBeGreaterThan(-1);
    child.kill(9);

    const server = startServer('..');
    expect(server.pid).toBeGreaterThan(-1);

    server.kill(9);
  });

  it('should kill the server process by pid', () => {
    expect(1).toBe(2);
  });

  it('should start and connect to the python spotting server', async () => {
    let status = '';
    const server = startServer();

    const intv = setInterval(() => {
      // try to create the WebSocket connection.
      const socket = new window.WebSocket('ws://localhost:8765');

      // Connection opened
      socket.addEventListener('open', function (event) {
        clearInterval(intv);
        // console.log('connected.')
        status = 'connected';
        socket.send('Hello Server!');
      });

      // Listen for messages
      socket.addEventListener('message', function (event) {
        console.log('Message from server ', event.data);
      });
    }, 2000);

    while (status === '') {
      let val = 99;
      val += 1;
    }

    expect(status).toBe('connected');
    server.kill(9);
  });

  it('should disconnect from the python spotting server', () => {
    expect(1).toBe(2);
  });
});
