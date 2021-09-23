/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import React, { useRef, useState, useEffect } from 'react';

export default function Hud() {
  // const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(0);
  const webSocket = useRef(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    webSocket.current = new WebSocket('ws://localhost:8080');
    webSocket.current.onmessage = (message) => {
      // setMessages((prev) => [...prev, message.data]);
      setMessage(message);
    };
    const timer = setTimeout(
      setElapsed((prev) => prev + 1),
      1000
    );

    return () => {
      webSocket.current.close();
      clearTimeout(timer);
    };
  }, [message]);

  return (
    <div className="flex flex-col justify-center">
      <div className="w-full text-centerrelative py-3 sm:max-w-xl sm:mx-auto">
        <div className="w-full bg-gray-600 p-4 rounded-full">
          <div className="flex justify-between h-24 w-full bg-gray-600 rounded-full">
            <div className="w-36 bg-gray-400 text-white p-3 rounded-full text-center">
              {elapsed}
              <br />
              Time Elapsed
            </div>
            <div className="w-32 h-32 bg-green-400 text-white p-6 rounded-full text-center -mb-12 mt-12 border-8 border-gray-600">
              <div className="text-2xl">75</div>
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
