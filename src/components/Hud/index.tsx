import React, { useCallback, useRef, useState, useEffect } from 'react';
import log from 'electron-log';
import { remote, ipcRenderer } from 'electron';
import { uuid } from 'uuidv4';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { ChildProcessWithoutNullStreams } from 'child_process';
import ParticipantsList from './ParticipantsList';
import spottingIcon from '../../../assets/spotting-icon-gray.png';
import spottingIconOn from '../../../assets/spotting-icon.png';
import playIcon from '../../../assets/play.png';
import blindIcon from '../../../assets/blind.png';
import resetIcon from '../../../assets/reset.png';
import expandIcon from '../../../assets/expand.png';
import defaultImg from '../../../assets/no-user.png';
import salespotLogo from '../../../assets/salespot-logo-red.png';
import { userDataDir } from '../../utils';
import Loading from '../Loading';
import MouseListener from '../../utils/MouseListener';

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

const newFace = (x: number, y: number) => {
  return {
    // directory: '/Users/nick/Desktop/',
    directory: `${userDataDir()}\\`,
    id: uuid(),
    x,
    y,
    image_path: defaultImg,
    status: 2,
  };
};

const SOCKET_URL = 'ws://localhost:8765';

export default function Hud() {
  const [elapsed, setElapsed] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [time, setTime] = useState(new Date());
  const [faces, setFaces] = useState([]);
  const [propFaces, setPropFaces] = useState([]);
  const [voiceMetrics, setVoiceMetrics] = useState(voiceMetricsDefault);
  const [isSpotting, setIsSpotting] = useState(false);
  const spottingBtn = useRef(null);
  const [clickCoords, setClickCoords] = useState({ x: -1, y: -1 });
  const [inSpottingToggleIcon, setInSpottingToggleIcon] = useState(false);
  const { sendMessage, sendJsonMessage, lastMessage, readyState } =
    useWebSocket(SOCKET_URL, {
      onOpen: () => {
        log.info('ws opened');
        const initMessage = JSON.stringify({
          destination_directory: `${userDataDir()}\\`,
          status_code: 1,
          faces,
        });
        sendMessage(initMessage);
      },
      onClose: () => log.info('ws closed'),
      onMessage: (e) => {
        const msg = JSON.parse(e.data);
        // log.info(msg);
        // msg.faces.forEach((face) => {
        //   log.info(face.status);
        //   log.info(face.x, ',', face.y);
        //   log.info(face.label);
        //   log.info(face.sentiment);
        // });
        setPropFaces(() => msg.faces);
        setVoiceMetrics(msg.voice_metrics);

        setTimeout(() => {
          msg.faces.push(...faces);
          sendJsonMessage(msg);

          // clear out faces to send queue here ONLY IF
          // the lenght is greater than 0, since it will have
          // sent the face above
          if (faces.length > 0) {
            setFaces([]);
          }
        }, 10);
      },
      // Will attempt to reconnect on all close events, such as server shutting down
      shouldReconnect: (closeEvent) => true,
    });

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  useEffect(() => {
    const timer = setTimeout(() => setElapsed((prev) => prev + 1), 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [elapsed]);

  useEffect(() => {
    const service: ChildProcessWithoutNullStreams = MouseListener().start();
    service.stdout.on('data', (e) => {
      const event = JSON.parse(e);
      setClickCoords({ x: Math.round(event.x), y: Math.round(event.y) });
    });
    return () => service.stdout.on('data', () => null);
  }, []);

  function clickExpand() {
    setExpanded((prev) => !prev);
    return expanded ? window.resizeTo(700, 180) : window.resizeTo(320, 180);
  }

  function clickEnd() {
    const pid = remote.getGlobal('serverPID');
    process.kill(pid);
    window.close();
  }

  useEffect(() => {
    if (!isSpotting || clickCoords.x === -1 || inSpottingToggleIcon) return;
    log.info(`you spotted someone at ${clickCoords.x},${clickCoords.y}`);
    setFaces((prev) => [...prev, newFace(clickCoords.x, clickCoords.y)]);
  }, [clickCoords]);

  return (
    <>
      {connectionStatus !== 'Open' && (
        <div className="text-center bg-gray-100 min-h-screen">
          <img src={salespotLogo} className="inline w-1/2" alt="expand" />
          <div className="">
            <Loading />
          </div>
        </div>
      )}
      {connectionStatus === 'Open' && (
        <div
          onMouseEnter={() => {
            log.info('mouse entered, set no spotting flag');
            setInSpottingToggleIcon(true);
          }}
          onMouseLeave={() => {
            log.info('mouse exit, remove no spotting flag');
            setInSpottingToggleIcon(false);
          }}
          className="absolute flex xl:mt-8 items-start md:min-h-screen xl:min-h-full rounded-3xl bg-gray-100 md:w-full xl:w-1/2 lg:m-auto lg:items-stretch"
        >
          <div className="flex z-50 flex-grow min-h-screen lg:min-h-0 flex-col p-3 content-center bg-white md:w-1/2 rounded-3xl">
            <div className="flex flex-grow flex-wrap justify-between content-center">
              <div className="text-sm text-gray-800 mt-1.5 font-semibold">
                {timeStyle.format(time)}
              </div>
              {/*
              <span>scale: {remote.screen.getPrimaryDisplay().scaleFactor}</span> */}
              {clickCoords.x},{clickCoords.y}
              {/* {window.devicePixelRatio} */}
              <div className="text-xs font-light">
                <button
                  onClick={clickEnd}
                  className="cursor-pointer bg-white border-2 rounded-lg border-gray-500 font-light px-6 py-1"
                  type="button"
                >
                  End
                </button>
              </div>
            </div>
            <div className="flex text-xs flex-grow space-x-2 justify-between">
              <div className="flex flex-col justify-end bg-gray-100 flex-1 p-3">
                <div>{Math.floor(elapsed / 60)}m</div>
                <div>Elapsed</div>
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
              <div className="flex">
                <img
                  // onClick={clickPlay}
                  src={playIcon}
                  className="w-4 h-4 cursor-pointer mr-1"
                  alt="SaleSpot"
                />
                <span className="text-sm">
                  {voiceMetrics.is_talking ? '🗣' : '😶'}
                </span>
                <span>
                  {/* {connectionStatus === 'Open' ? ' Active' : ' Initializing'} */}
                </span>
              </div>
              <div className="flex text-gray-700 space-x-4">
                <img
                  // onClick={clickReset}
                  src={resetIcon}
                  className="w-4 h-4 cursor-pointer mr-1"
                  alt="reset"
                />
                <img
                  // onClick={clickBlind}
                  src={blindIcon}
                  className="w-4 h-4 cursor-pointer mr-1"
                  alt="blind"
                />
                <img
                  ref={spottingBtn}
                  onClick={() => setIsSpotting((prev) => !prev)}
                  src={isSpotting ? spottingIconOn : spottingIcon}
                  className="w-4 h-4 cursor-pointer mr-1"
                  alt="spotting"
                />
                <img
                  onClick={clickExpand}
                  src={expandIcon}
                  className="w-4 h-4 cursor-pointer mr-1 sm:transform sm:rotate-180"
                  alt="expand"
                />
              </div>
            </div>
          </div>
          <ParticipantsList faces={propFaces} />
        </div>
      )}
    </>
  );
}
