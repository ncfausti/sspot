/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-implied-eval */
import React, { useEffect, useState, useRef } from 'react';
import log from 'electron-log';
import { ipcRenderer, remote } from 'electron';
import { XIcon } from '@heroicons/react/solid';

export default function AlertsConfig() {
  (global as any).threshold = 20;
  (global as any).ttf = 10;
  (global as any).alertMsg = '👍';
  const [timeToFire, setTimeToFire] = useState(remote.getGlobal('ttf'));
  const [message, setMessage] = useState(remote.getGlobal('alertMsg'));
  const [threshold, setThreshold] = useState(remote.getGlobal('threshold'));
  const [wait, setWait] = useState(remote.getGlobal('alertWait'));

  function updateThreshold(event) {
    setThreshold(event.target.value);
    ipcRenderer.invoke('set-threshold', event.target.value);

    if (typeof onChange === 'function') {
      onChange(event.target.value);
      log.info(event.target.value);
      // ipcRenderer.invoke('set-threshold', event.target.value);
    }
  }

  function updateTimeToFire(event) {
    setTimeToFire(event.target.value);
    ipcRenderer.invoke('set-time-to-fire', event.target.value);

    if (typeof onChange === 'function') {
      onChange(event.target.value);
      log.info(event.target.value);
      // ipcRenderer.invoke('set-time-to-fire', event.target.value);
    }
  }

  function updateMessage(event) {
    setMessage(event.target.value);
    log.info(event.target.value);
    ipcRenderer.invoke('set-alert-message', event.target.value);

    if (typeof onChange === 'function') {
      onChange(event.target.value);
      log.info(event.target.value);
      // ipcRenderer.invoke('set-alert-message', event.target.value);
    }
  }

  function updateWait(event) {
    setWait(event.target.value);
    log.info(event.target.value);
    ipcRenderer.invoke('set-additional-msg-wait', event.target.value);

    if (typeof onChange === 'function') {
      onChange(event.target.value);
      log.info(event.target.value);
      // ipcRenderer.invoke('set-alert-message', event.target.value);
    }
  }

  // const seconds = [
  //   0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  //   21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
  //   40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,
  //   59,
  // ];
  // const minutes = [
  //   0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  //   21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
  //   40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,
  //   59,
  // ];
  // const hours = [
  //   0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  //   21, 22, 23,
  // ];

  // useEffect(() => {}, []);

  return (
    <div className="p-6 text-sm h-screen dark:bg-black dark:text-white">
      <div className="flex justify-between border-b pb-1 mb-2">
        <div>Alerts</div>
        <div>
          <XIcon
            className="cursor-pointer w-5 h-5 dark:text-white hover:dark:text-gray-400"
            onClick={() => window.close()}
          />
        </div>
      </div>
      <div className="leading-8">
        Display an alert after my talk ratio has been above{' '}
        <input
          id="talk-ratio-threshold"
          name="talk-ratio-threshold"
          className="w-1/4 py-1 bg-gray-50 dark:bg-spotgray rounded"
          onChange={updateThreshold}
          value={threshold}
          type="number"
          min={0}
          max={99}
        />{' '}
        % for more than{' '}
        <input
          id="time-to-fire"
          name="time-to-fire"
          className="w-1/4 py-1 bg-gray-50 dark:bg-spotgray rounded"
          onChange={updateTimeToFire}
          value={timeToFire}
          type="number"
          min={0}
        />{' '}
        seconds.
        <br />
        Wait at least{' '}
        <input
          id="time-to-fire"
          name="time-to-fire"
          className="w-1/4 py-1 mt-4 bg-gray-50 dark:bg-spotgray rounded"
          onChange={updateWait}
          value={wait}
          type="number"
          min={0}
        />{' '}
        seconds before displaying the next alert.
      </div>
      <div className="pt-3 leading-8 flex flex-col text-sm">
        Message:{' '}
        <input
          id="message"
          name="message"
          className="bg-gray-50 dark:bg-spotgray py-1 rounded w-full"
          onChange={updateMessage}
          value={message}
          type="text"
          maxLength={20}
        />
      </div>
    </div>
  );
}
