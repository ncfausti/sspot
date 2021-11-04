import React, { useRef, useState, useEffect } from 'react';

interface Message {
  data: number;
}

export default function Hud() {
  const [message, setMessage] = useState({ data: 0 });
  const ws = useRef(new WebSocket('ws://localhost:8080'));
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    ws.current.onmessage = (msg : Message) => {
      setMessage(msg);
    };

    return () => {
      ws.current.close();
    };
  }, []);

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

  return (
    <div className="flex flex-col justify-center">
      <div className="w-full text-centerrelative py-3 sm:max-w-xl sm:mx-auto">
        <div className="w-full bg-gray-600 p-4 rounded-full">
          <div className="flex justify-between h-24 w-full bg-gray-600 rounded-full">
            <div className="w-36 bg-gray-400 text-white p-3 rounded-full text-center">
              <span className="text-2xl">{timeDisplay(elapsed)}</span>
              <br />
              Time Elapsed
            </div>
            <div
              className={`w-32 h-32 ${
                message.data > 5 ? 'bg-green-400' : 'bg-red-400'
              } text-white p-6 rounded-full text-center -mb-12 mt-12 border-8 border-gray-600`}
            >
              <div className="text-2xl">{parseInt(message.data, 10) * 10}</div>
              Score
            </div>
            <div className="w-36 bg-gray-400 text-white p-3 rounded-full text-center">
              {parseInt(message.data, 10) + 110} WPM
              <br />
              Talk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
