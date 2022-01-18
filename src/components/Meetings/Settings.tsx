import React, { SyntheticEvent, useEffect, useRef } from 'react';
import { ipcRenderer, remote } from 'electron';
import log from 'electron-log';
import { XIcon } from '@heroicons/react/solid';
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
      <div className="flex justify-between border-b pb-1 mb-1">
        <div>Settings</div>
        <div>
          <XIcon
            className="cursor-pointer w-5 h-5 dark:text-white hover:dark:text-gray-400"
            onClick={backClick}
          />
        </div>
      </div>
      <div className="flex flex-col items-start mt-2">
        <div className="text-xs">
          <span
            id="auto-detect-description"
            className="text-black dark:text-white font-semibold mr-3"
          >
            Auto Spot Faces
          </span>
          <span className="cursor-pointer">
            <ToggleButton
              size="sm"
              isEnabled={isAutoDetectOn}
              onChangeCallback={autoDetectChanged}
            />
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleView('alerts')}
          className="cursor-pointer outline-none text-black dark:text-white hover:dark:text-spotgrayltst text-xs font-semibold"
        >
          Manage Alerts
        </button>
        <button
          type="button"
          onClick={exitApp}
          className="cursor-pointer outline-none text-black dark:text-white hover:dark:text-spotgrayltst text-xs font-semibold"
        >
          Quit Application
        </button>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => handleView('release')}
          className="cursor-pointer text-xs text-spotblue hover:text-blue-700 outline-none"
        >
          Release Notes
        </button>
      </div>
    </fieldset>
  );
}
