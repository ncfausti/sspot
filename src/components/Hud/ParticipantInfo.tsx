/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useRef, useEffect, useState } from 'react';
import { ipcRenderer, remote } from 'electron';
import { useParams } from 'react-router-dom';
import log from 'electron-log';
import xImgWhite from '../../../assets/x-icon-white.png';
import xImgBlack from '../../../assets/x-icon.png';

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

export default function ParticipantInfo() {
  // const { faces, faceClickHandler } = props;
  const HUD_STARTING_WIDTH = 175;
  const mainHudWidth = 165;
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

  const [xImg, setXImg] = useState(xImgWhite);

  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      // dark mode
      log.info('dark mode');
      setXImg(xImgWhite);
    } else {
      // light mode
      log.info('light mode');
      setXImg(xImgBlack);
    }
  }, []);

  // on initial load only
  useEffect(() => {
    const interval = setInterval(
      () => setFaces(remote.getGlobal('propFaces')),
      200
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

  useEffect(() => {
    ipcRenderer.on('main-says-reset', () => {
      ipcRenderer.send('removeParticipant', params.pid);
      window.close();
    });
  }, []);

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
      className="flex flex-wrap h-screen bg-gray-100 dark:bg-black justify-evenly pt-5 px-7 rounded-hud"
    >
      {
        <div
          key={face.id}
          className="text-sm text-center relative hover-trigger"
        >
          <button
            type="button"
            id={face.id}
            onClick={faceClicked}
            style={{
              position: 'absolute',
              right: '-12px',
              top: '1px',
              background: `url(${xImg}) no-repeat`,
              backgroundSize: '13px',
            }}
            className="absolute text-tiny w-6 h-6 transparent hover-target cursor-pointer focus:outline-none"
          />
          <img
            src={face.image_path}
            className={`p-1 rounded-full border-4 ${
              face.sentiment >= 20 ? 'border-green-600' : 'border-gray-300'
            }`}
            alt={face.id}
          />
          {/* <div>{face.label}</div> */}
          <div
            className={`pl-2 rounded-full font-semibold ${
              face.sentiment > 20 ? 'text-green-600' : 'text-gray-900'
            }`}
          >
            {face.sentiment <= 0 || !face.sentiment
              ? '0%'
              : `${face.sentiment}%`}
          </div>
        </div>
      }
    </div>
  );
}
