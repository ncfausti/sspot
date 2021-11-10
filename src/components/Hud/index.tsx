import React, { useRef, useState, useEffect } from 'react';
import log from 'electron-log';
import { ipcRenderer } from 'electron';
import { Request } from 'zeromq';
import child_process from 'child_process';
import path from 'path';
import { uuid } from 'uuidv4';
import ParticipantsList from './ParticipantsList';
import spottingIcon from '../../../assets/spotting-icon.png';
import playIcon from '../../../assets/play.png';
import blindIcon from '../../../assets/blind.png';
import resetIcon from '../../../assets/reset.png';
import expandIcon from '../../../assets/expand.png';

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

export default function Hud() {
  const [message, setMessage] = useState<RequestMessage>();
  // const ws = useRef(new WebSocket('tcp://localhost:5555'));
  const [elapsed, setElapsed] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [time, setTime] = useState(new Date());
  const [spotting, setSpotting] = useState(true);
  const [monologue, setMonologue] = useState(0);
  const [talkRatio, setTalkRatio] = useState(0);
  const [responseObject, setResponseObject] = useState(null);
  const ws = useRef(null);
  const interval = useRef(null);
  // const [resp, setResp] = useRef(null);

  // This only runs once on initial render...
  useEffect(() => {
    ws.current = new Request();
    ws.current.connect('tcp://localhost:5555');

    // ws.current.onopen = () => console.log("ws opened");
    // ws.current.onclose = () => console.log("ws closed");

    const wsCurrent = ws.current;
    // ...and is cleaned up on unload of component
    return () => {
      wsCurrent.disconnect('tcp://localhost:5555');
    };
  }, []);

  // const request = {
  //   // Where the zip should get created
  //   destination_directory: path.join(userDataDir(), 'SaleSpot', uuid()),
  //   // 1 == run, 0 == stop server
  //   status_code: 1,
  //   // List of faces
  //   faces: [],
  // };

  // wsCurrent.send(JSON.stringify(request));

  // Remember! The client sets the cadence for request/reply
  // We can do this in a setInterval that executes a request/read every 50ms
  // if (spotting)
  //    execute a request/read
  // else
  //    clear the interval

  useEffect(() => {
    const timer = setTimeout(() => setElapsed((prev) => prev + 1), 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [elapsed]);

  const timeDisplay = (seconds: number) => {
    if (Number.isNaN(parseInt(seconds, 10))) return '00:00:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds - minutes * 60;
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;

    function fmtPadLeft(string, pad, length) {
      return (new Array(length + 1).join(pad) + string).slice(-length);
    }

    return `${fmtPadLeft(minutes, '0', 2)}:${fmtPadLeft(seconds, '0', 2)}`;
  };

  // TODO: change sentiment score with ws server input
  // TODO: change background color of senti-score bubble based on sentiment score
  // useEffect(() => {
  //   const interval = setInterval(() => setTime(new Date()), 1000);
  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, []);

  const dateStyle = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
    setSpotting(false);
    ws.current.disconnect('tcp://localhost:5555');
  }

  function keyPressed(e) {
    log.info(e);
  }

  useEffect(() => {
    async function Spot() {
      const request = {
        // Where the zip should get created
        destination_directory: path.join(userDataDir(), 'SaleSpot', uuid()),
        // 1 == run, 0 == stop server
        status_code: 1,
        // List of faces
        faces: [],
      };
      await ws.current.send(JSON.stringify(request));

      try {
        const [response] = await ws.current.receive();
        const msg = JSON.parse(response.toString());
        // setMonologue(msg.current_monologue);
        // setTalkRatio(msg.talk_ratio);
        // audio_location: "test.mp4"
        // faces: []
        // status_code: 1
        // voice_metrics:
        // current_monologue: 0
        // is_talking: false
        // longest_monologue: 0
        // talk_ratio: 0

        // const statusCode = msg.status_code;
        // if (statusCode === 0) {
        //   log.info(msg.error_message);
        // } else if (statusCode === 2) return;

        // await ws.current.send(JSON.stringify(request));
        // log.info(msg);
        // log.info(msg.voice_metrics.current_monologue);
        // setMonologue(msg.voice_metrics.current_monologue);
        // setTalkRatio(msg.voice_metrics.talk_ratio);
        // () => setResponseObject(msg);
        log.info(msg);
        return msg;
      } catch (e) {
        log.info(e);
      }
    }

    Spot()
      .then((response) => {
        setMonologue(response.voice_metrics.current_monologue);
        return response;
      })
      .then((response) => {
        setTalkRatio(response.voice_metrics.talk_ratio);
        return response;
      })
      .catch((e) => log.info(e));
  });

  return (
    // <div className="flex flex-col justify-center">
    //   <div className="w-full text-centerrelative py-3 sm:max-w-xl sm:mx-auto">
    //     <div className="w-full bg-gray-600 p-4 rounded-full">
    //       <div className="flex justify-between h-24 w-full bg-gray-600 rounded-full">
    //         <div className="w-36 bg-gray-400 text-white p-3 rounded-full text-center">
    //           <span className="text-2xl">{timeDisplay(elapsed)}</span>
    //           <br />
    //           Time Elapsed
    //         </div>
    //         <div
    //           className={`w-32 h-32 ${
    //             message.data > 5 ? 'bg-green-400' : 'bg-red-400'
    //           } text-white p-6 rounded-full text-center -mb-12 mt-12 border-8 border-gray-600`}
    //         >
    //           <div className="text-2xl">{parseInt(message.data, 10) * 10}</div>
    //           Score
    //         </div>
    //         <div className="w-36 bg-gray-400 text-white p-3 rounded-full text-center">
    //           {parseInt(message.data, 10) + 110} WPM
    //           <br />
    //           Talk
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </div>
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
            <div>{monologue}</div>
            <div>Monologue</div>
          </div>
          <div className="flex flex-col justify-end bg-gray-100 flex-1 p-3">
            <div>{talkRatio}</div>
            <div>Talk Ratio</div>
          </div>
        </div>
        <div className="flex flex-grow flex-wrap justify-between items-center">
          <div className="">
            <img
              onClick={clickPlay}
              src={playIcon}
              className="inline w-7 h-7 cursor-pointer mr-1"
              alt="SaleSpot"
            />
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
