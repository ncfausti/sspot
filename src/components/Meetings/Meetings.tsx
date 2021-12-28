/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/forbid-prop-types */
import React, { useCallback, useEffect, useState } from 'react';
import { CogIcon } from '@heroicons/react/solid';
import log from 'electron-log';
import { app, ipcRenderer, remote } from 'electron';
import logo from '../../../assets/salespot-logo-red.png';
// import { startServer } from '../../utils';
import Settings from './Settings';

export default function Meetings() {
  const [time, setTime] = useState(new Date());
  const [showSettingsView, setShowSettingsView] = useState(false);
  const [autoDetect, setAutoDetect] = useState(false);

  const SPACE_ABOVE_HUD = 40;
  const HUD_STARTING_WIDTH = 175;
  const HUD_STARTING_HEIGHT = 120;

  // on initial load only
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const dateStyle = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStyle = new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
  });

  function handleLaunchClick() {
    ipcRenderer.send('setAutoDetectBoolean', autoDetect);
    log.info('running launch click with autoDetect set to: ', autoDetect);

    const child = remote.getGlobal('serverProcess'); // startServer();
    if (child === null) {
      app.quit();
    } else {
      ipcRenderer.send('setGlobalServerPID', child.pid);
      ipcRenderer.send('setAutoDetectBoolean', autoDetect);

      let scriptOutput = '';

      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (data) => {
        log.info(`stdout: ${data}`);
        scriptOutput += data.toString();
      });

      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (data) => {
        log.info(`stderr: ${data}`);
        scriptOutput += data.toString();
      });

      child.on('close', (code) => {
        log.info(`closing code: ${code}`);
        log.info('Full output of script: ', scriptOutput);
      });
    }

    const midPointLessHalfHudWidth = window.screen.width / 2 - 80;

    log.info(
      'creating new window with userDataDir: ',
      remote.getGlobal('userDataDir')
    );

    const hudWindow = new remote.BrowserWindow({
      x: midPointLessHalfHudWidth,
      y: SPACE_ABOVE_HUD,
      width: HUD_STARTING_WIDTH,
      height: HUD_STARTING_HEIGHT,
      frame: false,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      transparent: true,
      paintWhenInitiallyHidden: false,
      webPreferences: {
        nodeIntegration: true,
        additionalArguments: [
          `--USER-DATA-DIR=${remote.getGlobal('userDataDir')}`,
        ],
        nativeWindowOpen: false,
        enableRemoteModule: true,
      },
      hasShadow: true,
      resizable: false,
    });

    hudWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    hudWindow.setAlwaysOnTop(true, 'screen-saver');
    hudWindow.setResizable(false);
    hudWindow.setHasShadow(true);
    hudWindow.loadURL(`file://${__dirname}/index.html#/live`);
    ipcRenderer.send('hideTrayWindow');
  }

  const memoizedBackClick = useCallback((e) => {
    log.info(e);
    setShowSettingsView(false);
  }, []);

  const memoizedAutoDetectChanged = useCallback((e) => {
    log.info('auto detect changed', e.target.checked);
    setAutoDetect((prev) => !prev);
  }, []);

  return (
    <div className="flex rounded-hud bg-gray-100 flex-grow flex-col p-3 min-h-screen content-center">
      <>
        {!showSettingsView && (
          <>
            <div className="flex flex-grow flex-wrap justify-between">
              <div className="text-xs text-gray-800 font-semibold">
                {dateStyle.format(time)}
              </div>
              <div className="text-xs font-light">{timeStyle.format(time)}</div>
            </div>
            <div className="flex flex-grow">
              <button
                type="button"
                onClick={handleLaunchClick}
                className="w-full
          border border-transparent text-xs font-semibold
          font-medium rounded-md shadow-sm text-white
          bg-blue-500 hover:bg-blue-600 focus:outline-none"
              >
                Launch SaleSpot
                {/* {autoDetect ? '(auto-detect)' : ''} */}
              </button>
            </div>
            <div className="flex flex-grow flex-wrap justify-between items-center">
              <div className="">
                <img src={logo} className="inline w-16 mr-1" alt="SaleSpot" />
                <span
                  style={{ fontSize: '8px' }}
                  className="inline text-xs text-gray-400 font-light"
                >
                  ⌘ + Y to toggle
                </span>
              </div>
              <div className="text-gray-700">
                <CogIcon
                  onClick={() => setShowSettingsView(true)}
                  className="h-4 w-4 cursor-pointer"
                />
              </div>
            </div>
          </>
        )}
        {showSettingsView && (
          <Settings
            backClick={memoizedBackClick}
            isAutoDetectOn={autoDetect}
            autoDetectChanged={memoizedAutoDetectChanged}
          />
        )}
      </>
    </div>
  );
}
