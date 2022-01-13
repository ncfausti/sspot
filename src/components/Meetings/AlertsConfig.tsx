/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-implied-eval */
import React, { useEffect, useState, useRef } from 'react';
import log from 'electron-log';

export default function AlertsConfig() {
  const [isTalking, setIsTalking] = useState(false);

  const refTalking = useRef(null);
  useEffect(() => {
    setInterval(
      (function (counter) {
        return function () {
          const THRESHOLD = 5;
          if (refTalking.current.value > 4 && counter >= THRESHOLD) {
            log.info('launching some alert now');
            counter = -5;
          } else if (refTalking.current.value > 4 && counter < THRESHOLD) {
            counter += 1;
          } else {
            counter = 0;
          }
          log.info(counter, refTalking.current);
        };
      })(0),
      1000
    );
  }, []);

  return (
    <div className="p-6 h-screen dark:bg-black dark:text-white">
      <button
        type="button"
        className="bg-gray-600 rounded p-3 outline-none"
        onClick={() => ++refTalking.current.value}
      >
        Talk
      </button>
      <button
        type="button"
        className="bg-gray-600 rounded p-3 outline-none"
        onClick={() => --refTalking.current.value}
      >
        Talk Less
      </button>
      <input type="hidden" ref={refTalking} />
      <br />
      {isTalking && 'talking'}
    </div>
  );
}
