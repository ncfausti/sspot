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
const { platform } = process;

export function removeItemById(
  id: string | number,
  array: { id: string | number }[]
) {
  return array.filter((face) => face.id !== id);
}

export default function Hud() {
  const [elapsed, setElapsed] = useState(0);
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
  const [paused, setPaused] = useState(false);

  const HUD_STARTING_WIDTH = 175;
  const HUD_EXPANDED_WIDTH = 340;
  const HUD_STARTING_HEIGHT = 120;
  const mainHudWidth = 165;
  const mainHudHeight = 110;

  const electronWindow = remote.getCurrentWindow();

  // Fix for Windows off by 1 pixel errors
  useEffect(() => {
    window.resizeTo(HUD_STARTING_WIDTH, HUD_STARTING_HEIGHT);
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

        setPropFaces(() =>
          msg.faces.filter(
            (face: DetectedFace) => !faceIdsToRemove.includes(face.id)
          )
        );

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
    // if on Windows, just set the width directly
    log.info(platform);
    if (platform !== 'darwin') {
      const widthDiff = Math.abs(window.outerWidth - HUD_STARTING_WIDTH);
      log.info(widthDiff);
      // if the difference between the window.outerWidth and starting width
      // is within an acceptable range (0 to 20px), then the HUD is NOT expanded
      // else if window.outerWidth - starting width is g.t. ~20px, then the window is
      // expanded
      if (widthDiff > 20) {
        log.info('hide participants');

        window.resizeTo(HUD_STARTING_WIDTH, HUD_STARTING_HEIGHT);
        electronWindow.setAlwaysOnTop(true, 'screen-saver');
      } else {
        // if diff is g.t. 20, width is expanded
        log.info('show participants');
        window.resizeTo(HUD_EXPANDED_WIDTH, HUD_STARTING_HEIGHT);
        electronWindow.setAlwaysOnTop(true, 'screen-saver');
      }
      return null;
    }
    return window.outerWidth > HUD_STARTING_WIDTH
      ? animatedResizeTo(HUD_STARTING_WIDTH, HUD_STARTING_HEIGHT)
      : animatedResizeTo(HUD_EXPANDED_WIDTH, HUD_STARTING_HEIGHT);
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
    setPaused(true);
  }

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

  useEffect(() => {
    if (!isSpotting || clickCoords.x === -1 || inAppUI) return;

    log.info(`you spotted someone at ${clickCoords.x},${clickCoords.y}`);
    setPaused(false);
    setCommand(1);
    const { screen } = window;
    const pctX = clickCoords.x / screen.width;
    const pctY = clickCoords.y / screen.height;

    setFaces((prev) => [...prev, newFace(pctX, pctY)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clickCoords]);

  const memoizedRemoveFace = useCallback((faceId: string) => {
    log.info('removing face', faceId);
    setFaceIdsToRemove((prev) => [...prev, faceId]);
  }, []);

  return (
    <>
      {connectionStatus !== 'Open' && (
        <div className="text-center pt-5 bg-gray-100">
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
            setInAppUI(true);
          }}
          onMouseLeave={() => {
            log.info('mouse exit, remove no spotting flag');
            setInAppUI(false);
          }}
          className="flex items-start rounded-hud"
        >
          <div
            style={{
              width: `${mainHudWidth}px`,
              height: `${mainHudHeight}px`,
            }}
            className="flex z-50 flex-col px-2 py-1 content-center bg-white rounded-hud"
          >
            <div className="flex flex-grow flex-wrap justify-between content-center pb-1">
              <div className="w-8">
                {/* {inAppUI && 'in'} */}
                <img
                  // onClick={clickBlind}
                  src={blindIcon}
                  className="hidden w-4 h-4 cursor-pointer mr-1"
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
              {/* {remote.getGlobal('autoDetectOn') === true && (
                <span className="text-xxs text-green-400">Auto Detect</span>
              )} */}
              <div className="text-xs font-light">
                <button
                  onClick={clickEnd}
                  className="bg-white border border-gray-900
                  rounded-hud text-gray-900 bg-white hover:bg-gray-900
                  hover:text-white text-xxs font-semibold px-1 cursor-pointer"
                  type="button"
                >
                  End
                </button>
              </div>
            </div>
            <div className="flex text-xs font-medium flex-grow space-x-2.5 justify-between">
              <div className="flex flex-col justify-end border border-spotblue bg-spotblue text-white flex-1 px-1 leading-tight">
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
              <div className="hidden flex flex-col justify-end bg-spotblue text-white flex-1 px-1">
                <div>{Math.floor(voiceMetrics.current_monologue / 60)}m</div>
                <div>Monologue</div>
              </div>
              <div className="flex flex-col justify-end border border-gray-900 text-gray-900 font-medium flex-1 px-1 leading-tight">
                <div className="text-base text-spotblue font-bold">
                  {voiceMetrics.talk_ratio}
                  <span className="font-medium">%</span>
                </div>
                <div className="pb-1">Talk Ratio</div>
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
                  <CountUp elapsed={elapsed} />
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
                    Math.abs(window.outerWidth - HUD_STARTING_WIDTH) > 20 &&
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
