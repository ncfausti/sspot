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

  const spottingBtn = useRef(null);
  const [isSpotting, setIsSpotting] = useState(false);
  const [faces, setFaces] = useState(remote.getGlobal('propFaces'));
  const faceClicked = () => {
    // use the id value stored in the alt attribute
    // to get the face id
    // faceClickHandler(e.target.id);
    // invoke main.removeParam with the face id
    ipcRenderer.send('removeParticipant', params.pid);
    window.close();
  };
  const [inAppUI, setInAppUI] = useState(false);
  const [spotIcon, setSpotIcon] = useState(spottingIconWhite);
  const [resetIcon, setResetIcon] = useState(resetIconWhite);
  // on initial load only
  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      // dark mode
      log.info('dark mode');
      setSpotIcon(spottingIconWhite);
      setResetIcon(resetIconWhite);
    } else {
      // light mode
      log.info('light mode');
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
      // setIsSpotting((prev) => !prev);
    });
  }, []);

  useEffect(() => {
    ipcRenderer.on('main-says-out-ui', () => {
      // setIsSpotting((prev) => !prev);
      setInAppUI(false);
    });
  }, []);

  // Last check before rendering
  if (face === undefined) {
    // window.close();
  }
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
      className="flex flex-wrap h-screen bg-gray-100 dark:bg-black justify-evenly rounded-hud"
    >
      <span className="flex flex-col justify-between p-5 rounded-hud">
        <span className="relative">
          {/* {inAppUI && 'in'} */}
          <img
            ref={spottingBtn}
            onClick={() => {
              setIsSpotting((prev) => !prev);
              ipcRenderer.invoke('set-spotting');
            }}
            src={isSpotting ? spottingIconOn : spotIcon}
            className={`${
              isSpotting && 'animate-ping'
            } cursor-pointer absolute`}
            alt="spotting"
          />
          {isSpotting && (
            <img
              className="absolute cursor-pointer"
              src={spottingIconOn}
              alt="spotting on"
              onClick={() => {
                setIsSpotting((prev) => !prev);
                ipcRenderer.invoke('set-spotting');
              }}
            />
          )}
        </span>
        <span>
          <img
            onClick={clickReset}
            src={resetIcon}
            className={`${effect && 'animate-reverse-spin'}
                    cursor-pointer`}
            onAnimationEnd={() => setEffect(false)}
            alt="reset"
          />
        </span>
      </span>
    </div>
  );
}
