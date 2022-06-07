/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/forbid-prop-types */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CogIcon, CalendarIcon } from '@heroicons/react/solid';
import log from 'electron-log';
import { app, ipcRenderer, remote, shell } from 'electron';
import MeetingsList from './MeetingsList';
import logo from '../../../assets/salespot-logo-long.png';
import logoDark from '../../../assets/salespot-logo-long-dark.png';
import { useAuth, logout } from '../../contexts/AuthContext';
import Settings from './Settings';
import calendarIcon from '../../../assets/calendar.png';

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
  const authCodeRef = useRef<HTMLInputElement>(null);

  const [events, setEvents] = useState([]);

  const { logout } = useAuth();

  useEffect(() => {
    (async () => {
      const results = await ipcRenderer.invoke('an-action', {
        userId: currentUser.uid,
      });
      log.info('IN MEETINGS: ', results);
      setEvents(Object.values(results));
    })();
  }, [currentUser.uid]);

  log.info(currentUser.uid);
  // function showPrev() {
  //   setEventList((prevState) => ({
  //     meetingIndex:
  //       prevState.meetingIndex - 1 >= 0 ? prevState.meetingIndex - 1 : 0,
  //   }));
  // }

  // function showNext() {
  //   setEventList((prevState) => ({
  //     meetingIndex:
  //       prevState.meetingIndex + 1 < prevState.eventList.length
  //         ? prevState.meetingIndex + 1
  //         : prevState.meetingIndex,
  //   }));
  // }

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

  // Handle
  useEffect(() => {
    ipcRenderer.on('init-calendar', (_event, authCode) => {
      // log.info('_event', _event);
      log.info('auth code:', authCode);
    });
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
  }, [currentUser.email, currentUser.uid]);

  const linkGoogleFirebase = async () => {
    // In prod, this comes from ipc call instead of user input
    // This will actually stay on main in production because the
    // custom protocol link will be handled there
    log.info(authCodeRef.current?.value);

    // send the link
    ipcRenderer.invoke('link-google-firebase', {
      uri: authCodeRef.current?.value,
      userId: currentUser.uid,
      userEmail: currentUser.email,
    });
  };

  return (
    <div className="flex rounded-hud bg-gray-100 dark:bg-black dark:text-white flex-grow flex-col p-3 min-h-screen content-start">
      <>
        {!showSettingsView && (
          <>
            <div className="flex flex-grow flex-wrap justify-between">
              <div className="text-xs text-gray-800 dark:text-white font-thin">
                Next Meeting
              </div>
              <div className="text-xs text-gray-800 dark:text-white font-semibold">
                {timeStyle.format(time)}
              </div>
              <div className="text-xs font-light font-semibold">
                {dateStyle.format(time)}
              </div>
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
            <div className="flex max-h-[150px]">
              <MeetingsList meetings={events} />
            </div>
            <div className={`${events.length > 0 ? 'hidden' : ''}`}>
              <button
                type="button"
                onClick={() => {
                  const platformIdentificationValue = '0'; // '1' on salespot-web
                  const calendarInitLink = `https://google-cal-webhooks-handler.nickfausti.repl.co/?state=${currentUser.uid}${platformIdentificationValue}`;
                  return shell.openExternal(calendarInitLink);
                }}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent
              text-sm font-medium rounded-full text-white bg-spotblue hover:bg-spotred100 focus:outline-none ${
                currentUser.gcalResourceId ? 'hidden' : ''
              }`}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <img
                    src={calendarIcon}
                    alt="Link Google Calendar"
                    className="h-4 w-4"
                  />
                </span>
                Link Google Calendar
              </button>
            </div>
            <div className="flex hidden">
              <button
                type="button"
                onClick={handleLaunchClick}
                className="w-full border border-transparent text-sm py-2 font-semibold
                font-medium rounded-md shadow-sm text-white bg-spotgray focus:outline-none"
              >
                Launch SaleSpot
                {/* {autoDetect ? '(auto-detect)' : ''} */}
              </button>
              dev:
              <input
                className="bg-black w-1/2"
                type="text"
                ref={authCodeRef}
              />{' '}
              <button
                type="button"
                className="bg-spotblue"
                onClick={() => linkGoogleFirebase()}
              >
                mock open sspot
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
                  type="button"
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
