/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useRef, useEffect, useState } from 'react';
import { ipcRenderer, remote } from 'electron';
import { useParams } from 'react-router-dom';
import log from 'electron-log';
import resetIconBlack from '../../../assets/reset.png';
import resetIconWhite from '../../../assets/reset-white.png';
import spottingIconWhite from '../../../assets/user-add-white.png';
import spottingIconBlack from '../../../assets/user-add.png';
import spottingIconOn from '../../../assets/user-add-red.png';
import WindowManager from '../../WindowManager';

interface Face {
  id: string;
  x: number;
  y: number;
  label: string;
  sentiment: number;
  image_path: string;
  status: number;
  directory: string;
}

function handleNewParticipant(pid: string) {
  ipcRenderer.invoke('new-participant-window', {
    browserWindowParams: {
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      backgroundColor: '#00000000',
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
    },
    extra: { pid },
  });
}

export default function ParticipantControls() {
  const params: { pid: string } = useParams();
  const [effect, setEffect] = useState(false);
  const [face, setFace] = useState({
    id: '',
    image_path: '',
    label: '',
    sentiment: 0,
    status: 0,
    x: 0,
    y: 0,
    directory: '',
  });

  const [isSpotting, setIsSpotting] = useState(false);
  const [faces, setFaces] = useState(remote.getGlobal('propFaces'));
  const [inAppUI, setInAppUI] = useState(false);
  const [spotIcon, setSpotIcon] = useState(spottingIconWhite);
  const [resetIcon, setResetIcon] = useState(resetIconWhite);

  // on faces.length changed
  useEffect(() => {
    // get the WindowManager instance
    const windows = [...WindowManager.getInstance().getWindows()];
    const windowIds = windows.map((window) => window.id);

    // get the difference between the current participant windows and the new faces
    const facesToOpenWindowsFor = faces.filter(
      (newFace: Face) => windowIds.indexOf(newFace.id) === -1
    );
    log.info('opening windows for...');
    log.info(facesToOpenWindowsFor);

    // Open windows for the new faces
    facesToOpenWindowsFor.forEach((newFace: Face) => {
      log.info('HANDLE NEW PARTICIPANT ID: ', newFace.id);
      handleNewParticipant(newFace.id);
    });
  }, [faces.length]);

  // on initial load only
  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      // dark mode
      setSpotIcon(spottingIconWhite);
      setResetIcon(resetIconWhite);
    } else {
      // light mode
      setSpotIcon(spottingIconBlack);
      setResetIcon(resetIconBlack);
    }

    const interval = setInterval(
      () => setFaces(remote.getGlobal('propFaces')),
      20
    );
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Grab the correct face using the pid query param
  useEffect(() => {
    const displayFace = faces.find((f: Face) => f.id === params.pid) || face;
    setFace(displayFace);
  }, [face, faces, params.pid]);

  function clickReset() {
    log.info('sending reset to main from Participant Info');
    setEffect(true);
    ipcRenderer.send('reset-meeting');
  }

  useEffect(() => {
    ipcRenderer.on('main-says-in-ui', () => {
      setInAppUI(true);
    });
  }, []);

  useEffect(() => {
    ipcRenderer.on('main-says-out-ui', () => {
      setInAppUI(false);
    });
  }, []);

  // When faces.length changes for the first time
  // and auto-detect is on

  return (
    <div
      onMouseEnter={() => {
        log.info('mouse entered, set no spotting flag');
        ipcRenderer.invoke('set-in-ui');
        setInAppUI(true);
      }}
      onMouseLeave={() => {
        log.info('mouse exit, remove no spotting flag');
        ipcRenderer.invoke('set-out-ui');
        setInAppUI(false);
      }}
      className="flex flex-wrap h-screen bg-gray-100 dark:bg-black rounded-hud"
    >
      <span className="flex flex-col justify-between p-1 rounded-hud">
        <span className="text-black text-center font-semibold text-lg dark:text-white">
          ({faces.length})
        </span>
        <span className="dark:bg-spotgray rounded has-tooltip">
          <span className="tooltip text-xxs translate-y-[-20px] rounded shadow-lg">
            Add add-
            <br />
            itional
            <br />
            /new
            <br /> participants to spot.
          </span>
          <img
            className={`cursor-pointer ${isSpotting && 'animate-pulse'}`}
            src={isSpotting ? spottingIconOn : spotIcon}
            alt="spotting on"
            onClick={() => {
              setIsSpotting((prev) => !prev);
              // if going from not spotting -> spotting
              if (!isSpotting) {
                const browserOptions = {
                  frame: false,
                  alwaysOnTop: true,
                  transparent: true,
                  backgroundColor: '#00000000',
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
                };
                ipcRenderer.invoke('open-alert-window', {
                  browserWindowParams: browserOptions,
                  extra: {
                    alertId: 'spotting-instructions',
                  },
                });
                if (localStorage.getItem('seen-disclaimer') !== 'true') {
                  // have not seen disclaimer yet, show it
                  ipcRenderer.invoke('open-alert-window', {
                    browserWindowParams: browserOptions,
                    extra: {
                      alertId: 'disclaimer',
                    },
                  });
                  localStorage.setItem('seen-disclaimer', 'true');
                }
              } else {
                ipcRenderer.invoke('close-alert-window', 'disclaimer');
                ipcRenderer.invoke(
                  'close-alert-window',
                  'spotting-instructions'
                );
              }
              ipcRenderer.invoke('set-spotting');
            }}
          />
        </span>
        <span className="dark:bg-spotgray rounded">
          <img
            onClick={clickReset}
            src={resetIcon}
            className={`${effect && 'animate-reverse-spin'} cursor-pointer`}
            onAnimationEnd={() => setEffect(false)}
            alt="reset"
          />
        </span>
      </span>
    </div>
  );
}
