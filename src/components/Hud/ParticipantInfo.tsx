/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { SyntheticEvent, useEffect, useState } from 'react';
import { ipcRenderer, remote } from 'electron';
import { useParams } from 'react-router-dom';
import log from 'electron-log';
import xImg from '../../../assets/x-icon.png';
import resetIcon from '../../../assets/reset.png';

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

  const [faces, setFaces] = useState(remote.getGlobal('propFaces'));
  const faceClicked = () => {
    // use the id value stored in the alt attribute
    // to get the face id
    // faceClickHandler(e.target.id);
    // invoke main.removeParam with the face id
    ipcRenderer.send('removeParticipant', params.pid);
    window.close();
  };

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

  function clickReset() {
    log.info('sending reset to main from Participant Info');
    ipcRenderer.send('reset-meeting');
  }

  // Last check before rendering
  if (face === undefined) {
    // window.close();
  }
  return (
    <div className="flex flex-wrap h-screen dark:bg-spotgraydk justify-evenly p-3">
      <img
        onClick={clickReset}
        src={resetIcon}
        className={`${effect && 'animate-reverse-spin'}
                    w-3 h-3 cursor-pointer`}
        onAnimationEnd={() => setEffect(false)}
        alt="reset"
      />
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
              right: '-25px',
              top: '1px',
              background: `url(${xImg}) no-repeat`,
              backgroundSize: '13px',
            }}
            className="absolute text-tiny w-6 h-6 transparent hover-target cursor-pointer focus:outline-none"
          />
          <img
            src={face.image_path}
            className={`w-10 rounded-full border-4 ${
              face.sentiment >= 20 ? 'border-green-600' : 'border-gray-300'
            }`}
            alt={face.id}
          />
          {/* <div>{face.label}</div> */}
          <div
            className={`pl-1 w-10 rounded-full font-semibold ${
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
