/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
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
import pauseIcon from '../../../assets/pause.png';
import blindIcon from '../../../assets/blind.png';
import resetIcon from '../../../assets/reset.png';
import expandIcon from '../../../assets/expand.png';
import defaultImg from '../../../assets/no-user.png';
import salespotLogo from '../../../assets/salespot-logo-red.png';
import { userDataDir } from '../../utils';
import Loading from '../Loading';
import MouseListener from '../../utils/MouseListener';
import CountUp from '../Clocks/CountUp';

interface RequestMessage {
  // Where the zip should get created
  destination_directory: string;
  // 1 == run, 0 == stop server
  command: number;
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
  // timeZoneName: 'short',
});

const voiceMetricsDefault = {
  current_monologue: 0,
  is_talking: false,
  longest_monologue: 0,
  talk_ratio: 0,
};

const newFace = (x: number, y: number) => {
  return {
    directory: userDataDir(),
    id: uuid(),
    x,
    y,
    image_path: defaultImg,
    status: 2,
  };
};

const SOCKET_URL = 'ws://localhost:8765';
const HUD_STARTING_WIDTH = 165;
const HUD_EXPANDED_WIDTH = 330;
const HUD_STARTING_HEIGHT = 110;

export function removeItemById(
  id: string | number,
  array: { id: string | number }[]
) {
  return array.filter((face) => face.id !== id);
}

export default function Hud(testing = false) {
  const [elapsed, setElapsed] = useState(0);
  const [expanded, setExpanded] = useState(window.innerWidth > 165);
  const [time, setTime] = useState(new Date());
  const [faces, setFaces] = useState<Face[]>([]);
  const [command, setCommand] = useState(1);
  const [propFaces, setPropFaces] = useState([]);
  const [faceIdsToRemove, setFaceIdsToRemove] = useState<string[]>([]);
  const [voiceMetrics, setVoiceMetrics] = useState(voiceMetricsDefault);
  const [isSpotting, setIsSpotting] = useState(false);
  const spottingBtn = useRef(null);
  const [clickCoords, setClickCoords] = useState({ x: -1, y: -1 });
  const [inAppUI, setInAppUI] = useState(false);
  const [effect, setEffect] = useState(false);
  const { sendMessage, sendJsonMessage, lastMessage, readyState } =
    useWebSocket(SOCKET_URL, {
      onOpen: () => {
        log.info('ws opened');
        const initMessage = JSON.stringify({
          destination_directory: userDataDir(),
          command,
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
        // debugger;
        setPropFaces(() =>
          msg.faces.filter((face) => !faceIdsToRemove.includes(face.id))
        );

        setVoiceMetrics(msg.voice_metrics);
        msg.command = command;

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

  // function that slowly resizes the window
  // x,y must be multiples of 5
  function animatedResizeTo(x: number, y: number) {
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
        if (window.innerWidth < x) {
          window.resizeBy(5, 0);
        }
        // if window is more than desired size, decrease it
        if (window.innerWidth > x) {
          window.resizeBy(-5, 0);
        }
      }
    }, 0);
  }

  function clickExpand() {
    setExpanded((prev) => !prev);
    return window.outerWidth > HUD_STARTING_WIDTH
      ? animatedResizeTo(HUD_STARTING_WIDTH, 110)
      : animatedResizeTo(HUD_EXPANDED_WIDTH, 110);
  }

  function clickPlayPause() {
    setCommand((prev) => {
      if (prev === 1) {
        log.info('previously in play mode, now in pause mode');
        return 3;
      }
      log.info('previously in pause mode, now in play mode');
      return 1;
    });
  }

  // function that sends reset command to server
  function clickReset() {
    setCommand(2);
    setEffect(true);
  }

  function clickEnd() {
    const pid = remote.getGlobal('serverPID');
    process.kill(pid);
    window.close();
  }

  useEffect(() => {
    if (!isSpotting || clickCoords.x === -1 || inAppUI) return;
    log.info(`you spotted someone at ${clickCoords.x},${clickCoords.y}`);
    setCommand(1);
    setFaces((prev) => [...prev, newFace(clickCoords.x, clickCoords.y)]);
  }, [clickCoords]);

  const memoizedRemoveFace = useCallback((faceId: string) => {
    log.info('removing face', faceId);
    setFaceIdsToRemove((prev) => [...prev, faceId]);
  }, []);

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
            setInAppUI(true);
          }}
          onMouseLeave={() => {
            log.info('mouse exit, remove no spotting flag');
            setInAppUI(false);
          }}
          className="flex items-start rounded-3xl bg-gray-100"
        >
          <div className="flex w-165 z-50 min-h-screen flex-col px-2 py-1 content-center bg-white rounded-xl">
            <div className="flex flex-grow flex-wrap justify-between content-center pb-1">
              <div>
                <img
                  // onClick={clickBlind}
                  src={blindIcon}
                  className="w-4 h-4 cursor-pointer mr-1"
                  alt="blind"
                />
              </div>
              {/*
              <span>scale: {remote.screen.getPrimaryDisplay().scaleFactor}</span> */}
              {/* {clickCoords.x},{clickCoords.y} */}
              <span className="text-xs text-gray-900 font-semibold">
                {timeStyle.format(new Date())}
              </span>
              {/* {window.devicePixelRatio} */}
              <div className="text-xs font-light">
                <button
                  onClick={clickEnd}
                  className="bg-white border border-gray-900
                  rounded-md text-gray-900 bg-white hover:bg-gray-900
                  hover:text-white text-xxs font-semibold px-1 cursor-pointer"
                  type="button"
                >
                  End
                </button>
              </div>
            </div>
            <div className="flex text-xs font-medium flex-grow space-x-2.5 justify-between">
              <div className="flex flex-col justify-end border border-spotblue bg-spotblue text-white flex-1 px-1 leading-tight">
                <div className="text-sm font-semibold ">
                  <CountUp elapsed={elapsed} />
                </div>
                <div>Time</div>
              </div>
              <div className="hidden flex flex-col justify-end bg-spotblue text-white flex-1 px-1">
                <div>{Math.floor(voiceMetrics.current_monologue / 60)}m</div>
                <div>Monologue</div>
              </div>
              <div className="flex flex-col justify-end border border-gray-900 text-gray-900 font-medium flex-1 px-1 leading-tight">
                <div className="text-sm text-spotblue font-semibold">
                  {voiceMetrics.talk_ratio}%
                </div>
                <div>Talk Ratio</div>
              </div>
            </div>
            <div className="flex flex-grow flex-wrap justify-between items-center pt-1">
              <div className="flex ">
                <img
                  onClick={clickPlayPause}
                  src={command === 1 ? pauseIcon : playIcon}
                  className="w-3 h-3 cursor-pointer mt-1 mr-1"
                  alt="SaleSpot"
                />
                <span className="text-sm">
                  {/* {voiceMetrics.is_talking ? '🗣' : '😶'} */}
                  {/* <CountUp elapsed={elapsed} /> */}
                </span>
                <span>
                  {/* {connectionStatus === 'Open' ? ' Active' : ' Initializing'} */}
                </span>
              </div>
              <div className="flex text-gray-700 space-x-8">
                <span className="flex space-x-1">
                  <img
                    onClick={clickReset}
                    src={resetIcon}
                    className={`${effect && 'animate-reverse-spin'}
                    w-3 h-3 cursor-pointer`}
                    onAnimationEnd={() => setEffect(false)}
                    alt="reset"
                  />
                  <span className="relative w-3 h-3">
                    <img
                      ref={spottingBtn}
                      onClick={() =>
                        setIsSpotting((prev) => {
                          if (prev === false) {
                            animatedResizeTo(
                              HUD_EXPANDED_WIDTH,
                              HUD_STARTING_HEIGHT
                            );
                          }
                          return !prev;
                        })
                      }
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
                        onClick={() =>
                          setIsSpotting((prev) => {
                            if (prev === false) {
                              animatedResizeTo(
                                HUD_EXPANDED_WIDTH,
                                HUD_STARTING_HEIGHT
                              );
                            }
                            return !prev;
                          })
                        }
                      />
                    )}
                  </span>
                </span>
                <img
                  onClick={clickExpand}
                  src={expandIcon}
                  className={`w-2 h-3 cursor-pointer mr-1 ${
                    window.outerWidth > HUD_STARTING_WIDTH &&
                    'transform rotate-180'
                  }`}
                  alt="expand"
                />
              </div>
            </div>
          </div>
          <ParticipantsList
            faces={propFaces}
            faceClickHandler={memoizedRemoveFace}
          />
        </div>
      )}
    </>
  );
}
