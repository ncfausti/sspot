/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useCallback, useRef, useState, useEffect } from 'react';
import log from 'electron-log';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { ChildProcessWithoutNullStreams } from 'child_process';
import { ipcRenderer, remote } from 'electron';
import { uuid } from 'uuidv4';
import { platform } from 'os';
import CountUp from '../Clocks/CountUp';
import Loading from '../Loading';
import ParticipantsList from './ParticipantsList';
import defaultImg from '../../../assets/loading.gif';
import expandIcon from '../../../assets/expand.png';
import expandIconWhite from '../../../assets/expand-white.png';
import pauseIcon from '../../../assets/pause.png';
import playIcon from '../../../assets/play.png';
import salespotLogo from '../../../assets/salespot-logo-red.png';
import spottingIcon from '../../../assets/spotting-icon-gray.png';
import spottingIconOn from '../../../assets/spotting-icon.png';
import { userDataDir } from '../../utils';
import MeetingAlert from '../Meetings/MeetingAlert';

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

export function removeItemById(
  id: string | number,
  array: { id: string | number }[]
) {
  return array.filter((face) => face.id !== id);
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

export default function Hud() {
  const [clickCoords, setClickCoords] = useState({ x: -1, y: -1 });
  const [command, setCommand] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [expand, setExpandIcon] = useState(expandIcon);
  const [faces, setFaces] = useState<Face[]>([]);
  const [inAppUI, setInAppUI] = useState(false);
  const [isSpotting, setIsSpotting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [propFaces, setPropFaces] = useState([]);
  const [showParticipants, setShowParticipants] = useState(true);
  const [voiceMetrics, setVoiceMetrics] = useState(voiceMetricsDefault);
  const spottingBtn = useRef(null);
  const refTalkRatio = useRef(null);
  const HUD_STARTING_WIDTH = 166;
  const mainHudWidth = process.platform === 'darwin' ? 166 : 163;
  const mainHudHeight = process.platform === 'darwin' ? 148 : 145;

  // Swap icons for dark mode / light mode
  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      setExpandIcon(expandIconWhite);
    } else {
      setExpandIcon(expandIcon);
    }
  }, []);

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
        setPaused(true);
        return 3;
      }
      setPaused(false);
      return 1;
    });
  }

  // send reset command to server and reset timer on client
  function clickReset() {
    setCommand(2);
    setElapsed(0);
  }

  useEffect(() => {
    ipcRenderer.on('main-says-reset', () => {
      clickReset();
      setTimeout(() => clickPlayPause(), 500);
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
    });
  }, []);

  useEffect(() => {
    ipcRenderer.on('main-says-out-ui', () => {
      setInAppUI(false);
    });
  }, []);

  function clickEnd() {
    ipcRenderer.invoke('bounce-server');
    window.close();
  }

  useEffect(() => {
    document.body.addEventListener('click', () => {
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
                // participants hidden, hide shadow
                Math.abs(window.outerWidth - HUD_STARTING_WIDTH) < 20
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
              className="flex z-50 shadow-hud flex-col p-[10px] px-5 bg-gray-100 dark:bg-black dark:text-white rounded-hud"
            >
              <div className="flex flex-grow flex-wrap justify-between pb-1">
                <div className="hidden w-8">{/* {inAppUI && 'in'} */}</div>
                {/* Top Row */}
                <span className="pl-1 text-lg text-gray-900 dark:text-white font-semibold">
                  {timeStyle.format(new Date())}
                </span>
                <div className="text-xs font-light">
                  <span className="has-tooltip">
                    <span className="tooltip rounded shadow-lg w-5/6 translate-x-[-80px] p-1 mt-8">
                      End SaleSpot Session
                    </span>
                    <button
                      onClick={clickEnd}
                      className="cursor-pointer bg-white text-gray-900 dark:bg-spotgray dark:text-white dark:hover:bg-spotgraylt border dark:border-none
                  rounded text-sm w-[40px] h-[28px] font-semibold px-1 focus:outline-none"
                      type="button"
                    >
                      End
                    </button>
                  </span>
                </div>
              </div>
              {/* /end Top Row */}
              {/* Main Content */}
              <div className="flex text-xs font-medium flex-grow">
                {/* My Score (hidden) */}
                <div className="flex flex-col hidden justify-end border border-spotblue bg-spotblue text-white flex-1 px-1 leading-tight">
                  <div className="text-sm">
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
                font-medium w-full px-4 py-1 leading-none has-tooltip"
                >
                  <span className="tooltip rounded shadow-lg translate-y-[-20px] py-1 px-3">
                    Your talk time
                  </span>
                  <div className="text-3xl text-spotblue dark:text-white font-bold">
                    {voiceMetrics.talk_ratio}
                    <span className="font-medium">%</span>
                    <MeetingAlert
                      voiceMetrics={voiceMetrics}
                      id="123"
                      message="abc"
                      rules={{
                        thresholdPercent: 0,
                        secondsUntilTrigger: 0,
                        showAlertForNSeconds: 0,
                        secondsDelayAfterTrigger: 0,
                      }}
                    />
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
                  <span className="pl-1 text-lg">
                    <CountUp elapsed={elapsed} />
                  </span>
                  <span>
                    {/* {connectionStatus === 'Open' ? ' Active' : ' Initializing'} */}
                  </span>
                </div>
                <div className="flex text-gray-700 space-x-8">
                  <span className="flex hidden space-x-1">
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
                  <span className="has-tooltip">
                    <span className="tooltip rounded shadow-lg translate-x-[-110px] w-4/5 py-1 px-3 -mt-6">
                      Show Participants
                    </span>
                    <img
                      onClick={
                        showParticipants === false ? clickHide : clickExpand
                      }
                      src={expand}
                      className={`w-[14px] h-[23px] cursor-pointer ${
                        showParticipants && 'transform rotate-180'
                      }`}
                      alt="expand"
                    />
                  </span>
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
