/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useCallback, useRef, useState, useEffect } from 'react';
import log from 'electron-log';
import { ipcRenderer, remote } from 'electron';
import { uuid } from 'uuidv4';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { ChildProcessWithoutNullStreams } from 'child_process';
import ParticipantsList from './ParticipantsList';
import spottingIcon from '../../../assets/spotting-icon-gray.png';
import spottingIconOn from '../../../assets/spotting-icon.png';
import playIcon from '../../../assets/play.png';
import pauseIcon from '../../../assets/pause.png';
import blindIcon from '../../../assets/blind.png';
import resetIcon from '../../../assets/reset.png';
import expandIcon from '../../../assets/expand.png';
import expandIconWhite from '../../../assets/expand-white.png';
import defaultImg from '../../../assets/loading.gif';
import salespotLogo from '../../../assets/salespot-logo-red.png';
import { userDataDir } from '../../utils';
import Loading from '../Loading';
import CountUp from '../Clocks/CountUp';

interface Face {
  directory: string;
  id: string;
  x: number;
  y: number;
  image_path: string;
  status: number;
}

interface DetectedFace {
  id: string;
  sentiment: number;
  label: string;
}

const timeStyle = new Intl.DateTimeFormat('en', {
  hour: 'numeric',
  minute: 'numeric',
});

const voiceMetricsDefault = {
  current_monologue: 0,
  is_talking: false,
  longest_monologue: 0,
  talk_ratio: 0,
};

const newFace = (x: number, y: number): Face => {
  return {
    directory: userDataDir() as string,
    id: uuid(),
    x,
    y,
    image_path: defaultImg,
    status: 2,
  };
};

const SOCKET_URL = 'ws://localhost:8765';
const SPACE_ABOVE_HUD = 40;
const { platform } = process;

export function removeItemById(
  id: string | number,
  array: { id: string | number }[]
) {
  return array.filter((face) => face.id !== id);
}

function handleNewParticipant(pid: string) {
  const numFaces = remote.getGlobal('propFaces').length;

  const POPUP_WIDTH = 172;
  const POPUP_HEIGHT = 148;
  const SPACE_BETWEEN = 40;

  ipcRenderer.invoke('new-participant-window', {
    browserWindowParams: {
      x:
        window.screen.width / 2 -
        POPUP_WIDTH / 2 +
        (numFaces + 2) * POPUP_WIDTH +
        SPACE_BETWEEN,
      y: SPACE_ABOVE_HUD,
      width: POPUP_WIDTH,
      height: POPUP_HEIGHT,
      frame: false,
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
    },
    extra: { pid },
  });
}

export default function Hud() {
  const [elapsed, setElapsed] = useState(0);
  const [faces, setFaces] = useState<Face[]>([]);
  const [command, setCommand] = useState(1);
  const [propFaces, setPropFaces] = useState([]);
  // const [faceIdsToRemove, setFaceIdsToRemove] = useState<string[]>([]);
  const [voiceMetrics, setVoiceMetrics] = useState(voiceMetricsDefault);
  const [isSpotting, setIsSpotting] = useState(false);
  const spottingBtn = useRef(null);
  const [clickCoords, setClickCoords] = useState({ x: -1, y: -1 });
  const [inAppUI, setInAppUI] = useState(false);
  const [effect, setEffect] = useState(false);
  const [paused, setPaused] = useState(false);

  const HUD_STARTING_WIDTH = 166;
  const HUD_EXPANDED_WIDTH = 340;
  const HUD_STARTING_HEIGHT = 148;
  const mainHudWidth = 166;
  const mainHudHeight = 148;

  const [showParticipants, setShowParticipants] = useState(true);

  // Fix for Windows off by 1 pixel errors
  // useEffect(() => {
  //   window.resizeTo(HUD_STARTING_WIDTH, HUD_STARTING_HEIGHT);
  // }, []);

  const { sendMessage, sendJsonMessage, readyState } = useWebSocket(
    SOCKET_URL,
    {
      onOpen: () => {
        log.info('ws opened');
        const initMessage = JSON.stringify({
          destination_directory: userDataDir(),
          command,
          faces,
          settings: { auto_detect: remote.getGlobal('autoDetectOn') },
        });
        sendMessage(initMessage);
      },
      onClose: () => log.info('ws closed'),
      onMessage: (e) => {
        const msg = JSON.parse(e.data);
        const faceIdsToRemove = remote.getGlobal('faceIdsToRemove');
        const filteredFaces = msg.faces.filter(
          (face: DetectedFace) => !faceIdsToRemove.includes(face.id)
        );
        setPropFaces(() => filteredFaces);
        ipcRenderer.send('setPropFaces', filteredFaces);

        setVoiceMetrics(msg.voice_metrics);
        msg.command = command;
        msg.settings = { auto_detect: remote.getGlobal('autoDetectOn') };

        setTimeout(() => {
          // add newly created faces
          msg.faces.push(...faces);

          // remove faces that were flagged for removal
          faceIdsToRemove.forEach((faceId: string) => {
            msg.faces = removeItemById(faceId, msg.faces);
          });

          sendJsonMessage(msg);

          // clear out faces to send queue here ONLY IF
          // the length is greater than 0, since it will have
          // sent the face above
          if (faces.length > 0) {
            setFaces([]);
          }
        }, 10);
      },
      // Will attempt to reconnect on all close events,
      // such as server shutting down
      shouldReconnect: () => true,
    }
  );

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  useEffect(() => {
    const timer = setTimeout(
      () =>
        setElapsed((prev) => {
          if (!paused) {
            return prev + 1;
          }
          return prev;
        }),
      1000
    );
    return () => {
      clearTimeout(timer);
    };
  }, [elapsed, paused]);

  // setup the mouse listener to detect clicks
  // when the app is not focused, i.e. when in spotting
  // mode and the user clicks out of the app (on a face)
  useEffect(() => {
    const service: ChildProcessWithoutNullStreams =
      remote.getGlobal('mouseListener');
    service.stderr.on('data', (e) => {
      log.error('error in mouse listener:');
      log.error(e);
    });
    service.stdout.on('data', (e) => {
      try {
        const event = JSON.parse(e);
        log.info(event);
        setClickCoords({ x: Math.round(event.x), y: Math.round(event.y) });
        setInAppUI(false);
      } catch (err) {
        log.info(e);
        log.error(err);
      }
    });
    return () => {
      service.stdout.on('data', () => null);
    };
  }, []);

  // function that slowly resizes the window
  // x,y must be multiples of 5
  function animatedResizeTo(x: number, y: number) {
    return;
    if (x % 5 !== 0 || y % 5 !== 0) {
      return;
    }
    if (x === 0 || y === 0) {
      return;
    }
    const timer = setInterval(() => {
      if (window.outerWidth === x && window.outerHeight === y) {
        clearInterval(timer);
      } else {
        // if window is less than desired size, increase it
        if (window.outerWidth < x) {
          window.resizeBy(15, 0);
        }
        // if window is more than desired size, decrease it
        if (window.outerWidth > x) {
          window.resizeBy(-15, 0);
        }
      }
    }, 0);
  }

  function clickExpand() {
    ipcRenderer.invoke('hide-participants');
    setShowParticipants(false);
  }

  function clickHide() {
    ipcRenderer.invoke('show-participants');
    setShowParticipants(true);
  }

  function clickPlayPause() {
    setCommand((prev) => {
      if (prev === 1) {
        log.info('previously in play mode, now in pause mode');
        setPaused(true);
        return 3;
      }
      log.info('previously in pause mode, now in play mode');
      setPaused(false);
      return 1;
    });
  }

  // send reset command to server and reset timer on client
  function clickReset() {
    setCommand(2);
    setEffect(true); // for animation of reset button
    setElapsed(0); // reset timer back to 0
    setPaused(false);
  }

  useEffect(() => {
    ipcRenderer.on('main-says-reset', () => {
      clickReset();
      clickPlayPause();
    });
  }, []);

  useEffect(() => {
    ipcRenderer.on('main-says-spot', () => {
      setIsSpotting((prev) => !prev);
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

  function clickEnd() {
    ipcRenderer.invoke('bounce-server');
    window.close();
  }

  useEffect(() => {
    document.body.addEventListener('click', () => {
      // e.stopPropagation();
      log.info('document.body.click');
      setInAppUI(true);
    });
  }, []);

  // This is where we add a participant to call
  useEffect(() => {
    if (!isSpotting || clickCoords.x === -1 || inAppUI) return;

    log.info(`You spotted someone at ${clickCoords.x},${clickCoords.y}`);
    setPaused(false);
    setCommand(1);
    const { screen } = window;
    const pctX = clickCoords.x / screen.width;
    const pctY = clickCoords.y / screen.height;

    const face = newFace(pctX, pctY);
    setFaces((prev) => [...prev, face]);
    ipcRenderer.send('addParticipant', face);

    // spawn a new BrowserWindow with ParticipantInfo component
    handleNewParticipant(face.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clickCoords]);

  const memoizedRemoveFace = useCallback((faceId: string) => {
    log.info('sending removeParticipant from Hud', faceId);
    // setFaceIdsToRemove((prev) => [...prev, faceId]);
    ipcRenderer.send('removeParticipant', faceId);
  }, []);

  return (
    <>
      {connectionStatus !== 'Open' && (
        <div className="text-center pt-5 bg-gray-100 dark:bg-black">
          <img src={salespotLogo} className="inline w-1/2" alt="expand" />
          <div className="">
            <Loading x={60} y={60} />
          </div>
        </div>
      )}
      {connectionStatus === 'Open' && (
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
          className="flex items-start rounded-hud"
        >
          <div
            id="contain-main-hud-shadow-bottom"
            className="flex items-start rounded-hud"
            style={{
              height: '148px',
              overflow: 'hidden',
              width: `${
                Math.abs(window.outerWidth - HUD_STARTING_WIDTH) < 20 // participants hidden, hide shadow
                  ? '175px'
                  : '175px'
              }`,
            }}
          >
            <div
              style={{
                width: `${mainHudWidth}px`,
                height: `${mainHudHeight}px`,
              }}
              className="flex z-50 shadow-hud flex-col p-3 bg-white dark:bg-black dark:text-white rounded-hud"
            >
              <div className="flex flex-grow flex-wrap justify-between pb-1">
                <div className=" w-8">
                  {inAppUI && 'in'}
                  {/* <img
                    // onClick={clickBlind}
                    src={blindIcon}
                    className="hidden w-4 h-4 cursor-pointer mr-1"
                    alt="blind"
                  /> */}
                </div>
                {/* Top Row */}
                <span className="pl-1 text-base text-gray-900 dark:text-white font-semibold">
                  {timeStyle.format(new Date())}
                </span>
                <div className="text-xs font-light">
                  <button
                    onClick={clickEnd}
                    className="cursor-pointer bg-white text-gray-900 dark:bg-spotgray dark:text-white dark:hover:bg-spotgraylt border dark:border-none
                  rounded text-sm w-[40px] h-[28px] font-semibold px-1 focus:outline-none"
                    type="button"
                  >
                    End
                  </button>
                </div>
              </div>
              {/* /end Top Row */}
              {/* Main Content */}
              <div className="flex text-xs font-medium flex-grow">
                {/* My Score (hidden) */}
                <div className="flex flex-col hidden justify-end border border-spotblue bg-spotblue text-white flex-1 px-1 leading-tight">
                  <div className="text-sm">
                    {/* <CountUp elapsed={elapsed} /> */}
                    <div className="text-base font-bold">
                      {propFaces[0]
                        ? (propFaces[0] as DetectedFace).sentiment
                        : '0'}
                      <span className="font-medium">%</span>
                    </div>
                  </div>
                  <div className="pb-1">My Score</div>
                </div>
                {/* /end My Score */}

                <div className="hidden flex flex-col justify-end bg-spotblue text-white flex-1 px-1">
                  <div>{Math.floor(voiceMetrics.current_monologue / 60)}m</div>
                  <div>Monologue</div>
                </div>

                {/* Talk Ratio */}
                <div
                  className="flex flex-col justify-end border border-spotgraydk text-gray-900 dark:bg-spotgraydk
                font-medium w-[92%] px-4 py-1 leading-none"
                >
                  <div className="text-3xl text-spotblue dark:text-white font-bold">
                    {voiceMetrics.talk_ratio}
                    <span className="font-medium">%</span>
                  </div>
                  <div className="dark:text-spotgrayltst text-lg">
                    Talk Ratio
                  </div>
                </div>
                {/* /end Talk Ratio */}
              </div>
              {/* /end Main Content */}
              {/* Bottom row */}
              <div className="flex flex-grow flex-wrap justify-between items-center pt-1">
                <div className="flex ">
                  <img
                    onClick={clickPlayPause}
                    src={command === 1 ? pauseIcon : playIcon}
                    className="hidden w-3 h-3 cursor-pointer mt-1 mr-1"
                    alt="SaleSpot"
                  />
                  <span className="pl-1 text-base">
                    {/* {voiceMetrics.is_talking ? '🗣' : '😶'} */}
                    <CountUp elapsed={elapsed} />
                  </span>
                  <span>
                    {/* {connectionStatus === 'Open' ? ' Active' : ' Initializing'} */}
                  </span>
                </div>
                <div className="flex text-gray-700 space-x-8">
                  <span className="flex space-x-1">
                    <span className="relative w-3 h-3">
                      <img
                        ref={spottingBtn}
                        onClick={() => setIsSpotting((prev) => !prev)}
                        src={isSpotting ? spottingIconOn : spottingIcon}
                        className={`${
                          isSpotting && 'animate-ping'
                        } w-3 h-3 cursor-pointer mr-1 absolute`}
                        alt="spotting"
                      />
                      {isSpotting && (
                        <img
                          className="absolute cursor-pointer w-3 h-3"
                          src={spottingIconOn}
                          alt="spotting on"
                          onClick={() => setIsSpotting((prev) => !prev)}
                        />
                      )}
                    </span>
                  </span>
                  <img
                    onClick={
                      showParticipants === false ? clickHide : clickExpand
                    }
                    src={expandIconWhite}
                    className={`w-[14px] h-[23px] cursor-pointer ${
                      showParticipants && 'transform rotate-180'
                    }`}
                    alt="expand"
                  />
                </div>
              </div>
              {/* /end Bottom Row */}
            </div>
          </div>
          <div className="hidden">
            <ParticipantsList
              faces={propFaces}
              faceClickHandler={memoizedRemoveFace}
            />
          </div>
        </div>
      )}
    </>
  );
}
