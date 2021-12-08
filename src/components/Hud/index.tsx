import React, { useCallback, useState, useEffect } from 'react';
import log from 'electron-log';
import { remote, ipcRenderer } from 'electron';
import { uuid } from 'uuidv4';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import ParticipantsList from './ParticipantsList';
import spottingIcon from '../../../assets/spotting-icon.png';
import spottingIconGray from '../../../assets/spotting-icon-gray.png';
import playIcon from '../../../assets/play.png';
import blindIcon from '../../../assets/blind.png';
import resetIcon from '../../../assets/reset.png';
import expandIcon from '../../../assets/expand.png';
import defaultImg from '../../../assets/no-user.png';
import salespotLogo from '../../../assets/salespot-logo-red.png';
import { userDataDir } from '../../utils';
import Loading from '../Loading';

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
  // directory: '/Users/nick/Desktop/',
  directory: userDataDir(),
  id: uuid(),
  x: 1225,
  y: 245,
  image_path: defaultImg,
  status: 2,
};

const newFace = (x, y) => {
  return {
    // directory: '/Users/nick/Desktop/',
    directory: userDataDir(),
    id: uuid(),
    x,
    y,
    image_path: defaultImg,
    status: 2,
  };
};

// set spotting mode bool

const SOCKET_URL = 'ws://localhost:8765';

export default function Hud() {
  const [elapsed, setElapsed] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [time, setTime] = useState(new Date());
  const [faces, setFaces] = useState([]);
  const [propFaces, setPropFaces] = useState([]);
  const [voiceMetrics, setVoiceMetrics] = useState(voiceMetricsDefault);
  const [messageHistory, setMessageHistory] = useState([]);
  const [isSpotting, setIsSpotting] = useState(false);
  const { sendMessage, sendJsonMessage, lastMessage, readyState } =
    useWebSocket(SOCKET_URL, {
      onOpen: () => {
        // log.info('ws opened');
        const initMessage = JSON.stringify({
          destination_directory: userDataDir(),
          status_code: 1,
          faces,
        });
        sendMessage(initMessage);
      },
      onClose: () => log.info('ws closed'),
      onMessage: (e) => {
        // log.info('onmessage msg, faces');
        const msg = JSON.parse(e.data);
        log.info(msg);
        log.info(msg.faces);

        // log.info(`Server says`);
        if (msg.faces.length > 0) {
          log.info(msg.faces[0].status);
          log.info(msg.faces[0].x, ',', msg.faces[0].y);
          log.info(msg.faces[0].label);
          log.info(msg.faces[0].sentiment);
        }
        // log.info(msg.voice_metrics);
        setPropFaces(() => msg.faces);
        setVoiceMetrics(msg.voice_metrics);

        setTimeout(() => {
          // log.info('inside readRespons...');
          msg.faces.push(...faces);
          // log.info(`Client sending:`);
          // log.info(msg.faces);
          // socket.send(JSON.stringify(msg));

          // WHY DOES THIS STOP SENDING AFTER A FEW SECONDS???
          sendJsonMessage(msg);

          // clear out faces to send queue here ONLY IF
          // the lenght is greater than 0, since it will have
          // sent the face above
          if (faces.length > 0) {
            setFaces([]);
          }
        }, 50);
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

  // for getting x,y of click
  useEffect(() => {
    window.addEventListener('blur', () => {
      ipcRenderer.send('cursorpos');
    });
  }, []);

  function clickExpand() {
    // log.info('expand clicked');
    setExpanded((prev) => !prev);
    return expanded ? window.resizeTo(600, 120) : window.resizeTo(300, 120);
  }

  function clickEnd() {
    // Read MyGlobalVariable.
    const pid = remote.getGlobal('serverPID');
    // log.info('killlinggggg');
    // log.info(pid);
    process.kill(pid);
    window.close();
  }

  function clickSpotting(e: Event) {
    e.stopPropagation();
    setIsSpotting((prev) => !prev);
    if (window.outerHeight < 600) {
      window.resizeTo(window.screen.width, window.screen.height);
      window.moveTo(0, 0);
    } else {
      window.resizeTo(300, 120);
      window.moveTo(window.screen.width / 2 - 150, 40);
    }
  }

  window.document.onclick = (e) => {
    if (window.outerHeight < 600) return;
    if (!isSpotting) return;
    // Renderer process
    ipcRenderer
      .invoke('get-cursor-pos')
      .then((result) => {
        // log.info(result);
        // log.info(newFace(result.x, result.y));
        setFaces((prev) => [...prev, newFace(result.x, result.y)]);
        return true;
      })
      .catch((e) => log.error(e));
  };

  // text appears to big when packaged...why?
  // popup window is too small when packaged...why?
  return (
    <>
      {connectionStatus !== 'Open' && (
        <div className="text-center pt-12 bg-gray-100 min-h-screen">
          <img src={salespotLogo} className="inline w-1/2" alt="expand" />
          <div className="">
            <Loading />
          </div>
        </div>
      )}
      {connectionStatus === 'Open' && (
        <div className="flex xl:mt-8 items-start md:min-h-screen xl:min-h-full rounded-3xl bg-gray-100 md:w-full xl:w-1/2 lg:m-auto lg:items-stretch">
          <div className="flex flex-grow min-h-screen lg:min-h-0 flex-col p-3 content-center bg-white md:w-1/2 rounded-3xl">
            <div className="flex flex-grow flex-wrap justify-between content-center">
              <div className="text-md text-gray-800  mt-1.5 font-semibold">
                {timeStyle.format(time)}
              </div>
              {/*
          <span>scale: {remote.screen.getPrimaryDisplay().scaleFactor}</span> */}
              <div className="text-md font-light">
                <button
                  onClick={() => clickEnd()}
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
                  className="inline w-7 h-7 cursor-pointer mr-1"
                  alt="SaleSpot"
                />
                <span className="text-2xl">
                  {voiceMetrics.is_talking ? '🗣' : '😶'}
                </span>
                <span>
                  {/* {connectionStatus === 'Open' ? ' Active' : ' Initializing'} */}
                </span>

                {isSpotting && 'spotting mode'}
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
                  onClick={(e) => clickSpotting(e)}
                  src={spottingIconGray}
                  className="inline w-7 h-7 cursor-pointer mr-1"
                  alt="spotting"
                />
                <img
                  onClick={clickExpand}
                  src={expandIcon}
                  className="inline p-1 w-7 h-7 cursor-pointer mr-1 md:transform md:rotate-180 xl:hidden"
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
