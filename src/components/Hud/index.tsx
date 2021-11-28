import React, { useRef, useState, useEffect } from 'react';
import log from 'electron-log';
import { remote, screen, ipcRenderer } from 'electron';
import { uuid } from 'uuidv4';
import ParticipantsList from './ParticipantsList';
import spottingIcon from '../../../assets/spotting-icon.png';
import playIcon from '../../../assets/play.png';
import blindIcon from '../../../assets/blind.png';
import resetIcon from '../../../assets/reset.png';
import expandIcon from '../../../assets/expand.png';
import { startServer } from '../../utils';

const ws = new window.WebSocket('ws://localhost:8765');

interface RequestMessage {
  // Where the zip should get created
  destination_directory: string;
  // 1 == run, 0 == stop server
  status_code: number;
  // List of faces
  faces: Face[];
}

interface Face {
  directory: string;
  id: string;
  x: number;
  y: number;
  image_path: string;
  status: number;
}

const timeStyle = new Intl.DateTimeFormat('en', {
  hour: 'numeric',
  minute: 'numeric',
  timeZoneName: 'short',
});

const voiceMetricsDefault = {
  current_monologue: 0,
  is_talking: false,
  longest_monologue: 0,
  talk_ratio: 0,
};

const exampleFace = {
  directory: '/Users/nick/Desktop/',
  id: 'xyz128228xzfa',
  x: 1195,
  y: 225,
  image_path: '/Users/nick/smile-ml/salespot-desktop/assets/no-user.png',
  status: 2,
};

function readResponseAndSendAnotherRequestAfterNMs(
  socket,
  e,
  facelist,
  msWait
) {
  if (!socket) return;

  const msg = JSON.parse(e.data);
  console.log(`Server says`);
  if (msg.faces.length > 0) {
    console.log(msg.faces[0].status);
    console.log(msg.faces[0].x, ',', msg.faces[0].y);
    console.log(msg.faces[0].label);
    console.log(msg.faces[0].sentiment);
  }

  setTimeout(() => {
    console.log('inside readRespons...');
    console.log(facelist);
    msg.faces.push(...facelist);
    console.log(`Client sending:`);
    console.log(msg.faces);
    ws.send(JSON.stringify(msg));

    // Clear faces and let the server control facelist on
    // next message recv
    faces = [];
  }, msWait);
}

export default function Hud() {
  const [elapsed, setElapsed] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [time, setTime] = useState(new Date());
  const [faces, setFaces] = useState([]);
  const [voiceMetrics, setVoiceMetrics] = useState(voiceMetricsDefault);

  ws.onopen = (e) => {
    log.info('ws opened');
    const initMessage = JSON.stringify({
      destination_directory: '/Users/nick/Desktop/',
      status_code: 1,
      faces,
    });
    ws.send(initMessage);
  };

  // recv message from the server
  ws.onmessage = (e) => {
    log.info('onmessage faces');
    readResponseAndSendAnotherRequestAfterNMs(ws, e, faces, 0);
  };

  ws.onclose = (e) => {
    log.info('ws closed');
  };

  useEffect(() => {
    const timer = setTimeout(() => setElapsed((prev) => prev + 1), 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [elapsed]);

  // for getting x,y of click
  useEffect(() => {
    window.addEventListener('blur', () => {
      log.info('blurrred');
      ipcRenderer.send('cursorpos');
    });
  }, []);

  function clickExpand() {
    log.info('expand clicked');
    setExpanded((prev) => !prev);
    return expanded ? window.resizeTo(600, 120) : window.resizeTo(300, 120);
  }

  function clickEnd() {
    // Read MyGlobalVariable.
    const pid = remote.getGlobal('myGlobalVariable');
    log.info('killlinggggg');
    log.info(pid);
    process.kill(pid);

    // restart the server
    log.info('restartinggggg');
    const child = startServer();
    ipcRenderer.send('setMyGlobalVariable', child.pid);
    window.close();
  }

  return (
    <div className="flex">
      <div className="flex flex-grow flex-col bg-white p-3 min-h-screen content-center md:w-1/2 rounded-xl">
        <div className="flex flex-grow flex-wrap justify-between content-center">
          <div className="text-md text-gray-800  mt-1.5 font-semibold">
            {timeStyle.format(time)}
          </div>
          <button
            type="button"
            onClick={() => {
              setFaces((prev) => [...prev, exampleFace]);
              log.info(faces);
            }}
          >
            Send Face
          </button>
          <div className="text-md font-light">
            <button
              onClick={clickEnd}
              className="cursor-pointer bg-white border-2 rounded-lg border-gray-500 font-light px-6 py-1"
              type="button"
            >
              End
            </button>
          </div>
        </div>
        <div className="flex flex-grow space-x-2 justify-between">
          <div className="flex flex-col justify-end bg-gray-100 flex-1 p-3">
            <div>{Math.floor(elapsed / 60)}m</div>
            <div>Time Elapsed</div>
          </div>
          <div className="flex flex-col justify-end bg-gray-100 flex-1 p-3">
            <div>{Math.floor(voiceMetrics.current_monologue / 60)}m</div>
            <div>Monologue</div>
          </div>
          <div className="flex flex-col justify-end bg-gray-100 flex-1 p-3">
            <div>{voiceMetrics.talk_ratio}%</div>
            <div>Talk Ratio</div>
          </div>
        </div>
        <div className="flex flex-grow flex-wrap justify-between items-center">
          <div className="">
            <img
              // onClick={clickPlay}
              src={playIcon}
              className="hidden inline w-7 h-7 cursor-pointer mr-1"
              alt="SaleSpot"
            />
            <span className="text-2xl">
              {voiceMetrics.is_talking ? '🗣' : '😶'}
            </span>
          </div>
          <div className="text-gray-700 space-x-4">
            {/* <SpottingIcon className="h-4 w-4 cursor-pointer" /> */}
            <img
              // onClick={clickReset}
              src={resetIcon}
              className="inline w-7 h-7 cursor-pointer mr-1"
              alt="reset"
            />
            <img
              // onClick={clickBlind}
              src={blindIcon}
              className="inline w-7 h-7 cursor-pointer mr-1"
              alt="blind"
            />
            <img
              // onClick={clickSpotting}
              src={spottingIcon}
              className="inline w-7 h-7 cursor-pointer mr-1"
              alt="spotting"
            />
            <img
              onClick={clickExpand}
              src={expandIcon}
              className="inline p-1 w-7 h-7 cursor-pointer mr-1 md:transform md:rotate-180"
              alt="expand"
            />
          </div>
        </div>
      </div>
      <ParticipantsList />
    </div>
  );
}
