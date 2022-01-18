import React, { SyntheticEvent, useEffect, useRef } from 'react';
import { ipcRenderer, remote } from 'electron';
import log from 'electron-log';
import ToggleButton from '../ToggleButton';

export default function Settings(props: {
  isAutoDetectOn: boolean;
  backClick: () => void;
  autoDetectChanged: (autoDetect: boolean) => void;
}) {
  const { isAutoDetectOn, backClick, autoDetectChanged } = props;

  const exitApp = () => {
    ipcRenderer.send('close-me');
  };

  useEffect(() => {
    log.info('autodetect is: ', isAutoDetectOn);
  }, [isAutoDetectOn]);

  function handleView(view: string) {
    const NOTES_WIDTH = 400;
    const NOTES_HEIGHT = 400;

    const hudWindow = new remote.BrowserWindow({
      x: window.screen.width / 2 - NOTES_WIDTH / 2,
      y: window.screen.height / 2 - NOTES_HEIGHT / 2,
      width: NOTES_WIDTH,
      height: NOTES_HEIGHT,
      frame: false,
      alwaysOnTop: false,
      transparent: false,
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
    hudWindow.loadURL(`file://${__dirname}/index.html#/${view}`);
  }

  return (
    <fieldset className="space-y-0">
      <div className="relative flex items-start">
        <div className="flex items-center h-5">
          <ToggleButton />
        </div>
        <div className="ml-3 text-xs">
          <label
            htmlFor="check-auto-detect"
            className="font-medium text-gray-700"
          >
            Auto-detect{' '}
          </label>
          <span id="auto-detect-description" className="text-gray-500">
            <span className="sr-only">Auto-detect </span>faces when{' '}
            <span className="font-semibold">Launch SaleSpot</span> is clicked.
          </span>
        </div>
      </div>
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => handleView('alerts')}
          className="cursor-pointer text-left text-xs text-spotblue hover:text-blue-700 outline-none "
        >
          Manage Alerts
        </button>
        <button
          type="button"
          onClick={() => handleView('release')}
          className="cursor-pointer text-left text-xs text-spotblue hover:text-blue-700 outline-none "
        >
          Release Notes
        </button>
      </div>

      <div className={`${true && 'hidden'} relative flex items-start`}>
        <div className="flex items-center h-5">
          <input
            id="check-debug"
            aria-describedby="debug-description"
            name="check-debug"
            type="checkbox"
            className="focus:ring-spotblue h-4 w-4 text-spotblue border-gray-300 rounded"
          />
        </div>
        <div className="ml-3 text-xs">
          <label htmlFor="check-debug" className="font-medium text-gray-700">
            Debug mode
          </label>
          <span id="debug-description" className="text-gray-500">
            <span id="check-debug" className="sr-only">
              Debug{' '}
            </span>
          </span>
        </div>
      </div>
      <div>
        <button
          type="button"
          onClick={backClick}
          className="cursor-pointer float-right text-right bg-spotblue hover:bg-blue-700 text-white font-bold text-xxs py-1 px-2 rounded"
        >
          Back
        </button>

        <button
          type="button"
          onClick={exitApp}
          className="cursor-pointer float-right text-right mr-3 bg-spotred hover:bg-red-800 text-white font-bold text-xxs py-1 px-2 rounded"
        >
          Quit
        </button>
      </div>
    </fieldset>
  );
}
