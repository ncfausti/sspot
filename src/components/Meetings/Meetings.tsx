/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/forbid-prop-types */
import React, { useCallback, useEffect, useState } from 'react';
import { CogIcon, CalendarIcon } from '@heroicons/react/solid';
import log from 'electron-log';
import { app, ipcRenderer, remote, shell } from 'electron';
import MeetingsList from './MeetingsList';
import logo from '../../../assets/salespot-logo-long.png';
import logoDark from '../../../assets/salespot-logo-long-dark.png';
import { useAuth, logout } from '../../contexts/AuthContext';

// import { startServer } from '../../utils';
import Settings from './Settings';

export default function Meetings() {
  const [time, setTime] = useState(new Date());
  const [showSettingsView, setShowSettingsView] = useState(false);
  const [autoDetect, setAutoDetect] = useState(false);

  const SPACE_ABOVE_HUD = 40;
  const HUD_STARTING_WIDTH = 166;
  const HUD_STARTING_HEIGHT = 148;

  const [saleSpotLogo, setSaleSpotLogo] = useState(logo);

  // firebase auth + calendar data
  const { currentUser } = useAuth();
  const [meetingIndex] = useState(0);
  const [eventList, setEventList] = useState([
    { startTime: '10:00AM', startDate: '1/1/2000', id: -1 },
  ]);
  const { logout } = useAuth();

  function showPrev() {
    setEventList((prevState) => ({
      meetingIndex:
        prevState.meetingIndex - 1 >= 0 ? prevState.meetingIndex - 1 : 0,
    }));
  }

  function showNext() {
    setEventList((prevState) => ({
      meetingIndex:
        prevState.meetingIndex + 1 < prevState.eventList.length
          ? prevState.meetingIndex + 1
          : prevState.meetingIndex,
    }));
  }

  log.info(currentUser.email);
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

    ipcRenderer.invoke('new-hud-window', {
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
  }

  const memoizedBackClick = useCallback((e) => {
    log.info(e);
    setShowSettingsView(false);
  }, []);

  const memoizedAutoDetectChanged = useCallback((e) => {
    log.info(e);
    log.info('auto detect changed', e);
    setAutoDetect((prev) => !prev);
  }, []);

  // on initial load only
  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      // dark mode
      setSaleSpotLogo(logo);
    } else {
      // light mode
      setSaleSpotLogo(logoDark);
    }
  }, []);

  return (
    <div className="flex rounded-hud bg-gray-100 dark:bg-black dark:text-white flex-grow flex-col p-3 min-h-screen content-center">
      <>
        {!showSettingsView && (
          <>
            <div className="flex flex-grow flex-wrap justify-between">
              <div className="text-xs text-gray-800 dark:text-white font-semibold">
                {dateStyle.format(time)}
              </div>
              <div className="text-xs font-light">{timeStyle.format(time)}</div>
            </div>
            <div className="flex">
              <button
                type="button"
                onClick={handleLaunchClick}
                className="w-full border border-transparent text-sm py-2 font-semibold
                font-medium rounded-md shadow-sm text-white bg-spotblue focus:outline-none"
              >
                Join Meeting and Launch
                {/* {autoDetect ? '(auto-detect)' : ''} */}
              </button>
            </div>
            <div className="flex">
              <MeetingsList />
            </div>
            <button
              type="button"
              onClick={() => shell.openExternal('http://localhost:8000')}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-spotblue hover:bg-spotred100 focus:outline-none"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <CalendarIcon
                  className="h-5 w-5 text-white-500 group-hover:text-white-400"
                  aria-hidden="true"
                />
              </span>
              Link Google Calendar
            </button>
            <div className="flex">
              <button
                type="button"
                onClick={handleLaunchClick}
                className="w-full border border-transparent text-sm py-2 font-semibold
                font-medium rounded-md shadow-sm text-white bg-spotgray focus:outline-none"
              >
                Launch SaleSpot
                {/* {autoDetect ? '(auto-detect)' : ''} */}
              </button>
            </div>
            <div className="flex flex-grow flex-wrap justify-between items-center">
              <div className="">
                <img
                  src={saleSpotLogo}
                  className="inline w-24 mr-1"
                  alt="SaleSpot"
                />
                <span
                  style={{ fontSize: '8px' }}
                  className="inline text-xs text-gray-400 font-light"
                />
              </div>
              <div>
                <button
                  className="text-xs font-light bg-gray-100 dark:bg-spotgray rounded-md px-6 py-2"
                  onClick={() => logout()}
                >
                  Dashboard
                </button>
              </div>
              <div className="text-gray-700 hover:delay-1000 has-tooltip ">
                <CogIcon
                  onClick={() => setShowSettingsView(true)}
                  className="h-5 w-5 cursor-pointer dark:text-white text-black"
                />
                <div className="tooltip rounded whitespace-nowrap translate-x-[-100px] shadow-lg p-1 bg-gray-100 -mt-8">
                  View Settings
                </div>
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
