import React, { useRef, useState, useEffect } from 'react';
import log from 'electron-log';
import path from 'path';
import { uuid } from 'uuidv4';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import ParticipantsList from './ParticipantsList';
import spottingIcon from '../../../assets/spotting-icon.png';
import playIcon from '../../../assets/play.png';
import blindIcon from '../../../assets/blind.png';
import resetIcon from '../../../assets/reset.png';
import expandIcon from '../../../assets/expand.png';
import { startServer } from '../../utils';

interface RequestMessage {
  // Where the zip should get created
  destination_directory: string;
  // 1 == run, 0 == stop server
  status_code: number;
  // List of faces
  faces: Face[];
}

interface Face {
  id: string;
  x: number;
  y: number;
}

// Get the OS specific appData folder from the additional
// additionalArgs. values passed at startup in the Main process
function userDataDir() {
  try {
    return window.process.argv
      .filter((v) => v.startsWith('--USER-DATA-DIR'))[0]
      .split('=')[1];
  } catch (e) {
    log.info('Info: --USER-DATA-DIR not specified on process.argv');
    return null;
  }
}

const voiceMetricsDefault = {
  current_monologue: 0,
  is_talking: false,
  longest_monologue: 5,
  talk_ratio: 0,
};

export default function Hud() {
  const [message, setMessage] = useState<RequestMessage>();
  const [elapsed, setElapsed] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [time, setTime] = useState(new Date());
  const [spotting, setSpotting] = useState(true);
  const [monologue, setMonologue] = useState(0);
  const [talkRatio, setTalkRatio] = useState(0);
  const [voiceMetrics, setVoiceMetrics] = useState(voiceMetricsDefault);
  const [currentMsg, setCurrentMsg] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    wsRef.current = new window.WebSocket('ws://localhost:8765');
    wsRef.current.onmessage = function (event) {
      setCurrentMsg(event.data);
      wsRef.current.send(JSON.stringify(event.data));
    };
    wsRef.current.onopen = () => log.info('ws opened');
    wsRef.current.onclose = () => log.info('ws closed');
  }, []);

  function respond(isSpotting: boolean) {
    if (!wsRef.current) return;
    wsRef.current.onmessage = (e) => {
      if (!isSpotting) return;
      const msg = JSON.parse(e.data);
      // log.info('e', msg);
      setVoiceMetrics(msg.voice_metrics);
    };
  }

  useEffect(() => {
    respond(spotting);
  }, [spotting, voiceMetrics]);

  useEffect(() => {
    const timer = setTimeout(() => setElapsed((prev) => prev + 1), 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [elapsed]);

  const timeStyle = new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
  });

  function clickPlay() {
    log.info('play clicked');
  }

  function clickReset() {
    log.info('reset clicked');
  }

  function clickBlind() {
    log.info('blind clicked');
  }

  function clickSpotting() {
    log.info('spotting clicked');
  }

  function clickExpand() {
    log.info('expand clicked');
    setExpanded((prev) => !prev);
    return expanded ? window.resizeTo(600, 120) : window.resizeTo(300, 120);
  }

  function clickEnd() {
    setSpotting((prev) => !prev);
  }

  function keyPressed(e) {
    log.info(e);
  }

  function sendReq() {
    try {
      wsRef.current.send(
        JSON.stringify({
          destination_directory:
            '/Users/nick/smile-ml/salespot-desktop/assets/no-user.png',
          status_code: 1,
          faces: [],
        })
      );
    } catch (e) {
      log.error(e);
    }
  }

  useEffect(() => {
    const id = setInterval(() => {
      sendReq();
    }, 50);
    return () => {
      clearInterval(id);
    };
  });

  return (
    <div className="flex">
      <div className="flex flex-grow flex-col bg-white p-3 min-h-screen content-center md:w-1/2 rounded-xl">
        <div className="flex flex-grow flex-wrap justify-between content-center">
          <div className="text-md text-gray-800  mt-1.5 font-semibold">
            {timeStyle.format(time)}
          </div>
          <div className="text-md font-light">
            <button
              onClick={clickEnd}
              className="cursor-pointer bg-white border-2 rounded-lg border-gray-500 font-light px-6 py-1"
              type="button"
            >
              {spotting ? 'End' : 'Start'}
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
              onClick={clickPlay}
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
              onClick={clickReset}
              src={resetIcon}
              className="inline w-7 h-7 cursor-pointer mr-1"
              alt="reset"
            />
            <img
              onClick={clickBlind}
              src={blindIcon}
              className="inline w-7 h-7 cursor-pointer mr-1"
              alt="blind"
            />
            <img
              onClick={clickSpotting}
              src={spottingIcon}
              className="inline w-7 h-7 cursor-pointer mr-1"
              alt="spotting"
            />
            <img
              onClick={clickExpand}
              onKeyPress={keyPressed}
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
