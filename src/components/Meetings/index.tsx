/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react';
import { CogIcon } from '@heroicons/react/solid';
import log from 'electron-log';
import { ipcRenderer } from 'electron';
import logo from '../../../assets/salespot-logo-red.png';
import { startServer } from '../../utils';

export default function Meetings() {
  const [time, setTime] = useState(new Date());

  // on initial load only
  useEffect(() => {
    // const child = startServer();
    // ipcRenderer.send('setGlobalServerPID', child.pid);

    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

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

  function handleLaunchClick() {
    log.info('running launch click');
    const child = startServer();
    ipcRenderer.send('setGlobalServerPID', child.pid);
    window.open(
      `file://${__dirname}/index.html#/live`,
      '_blank',
      `top=40,left=600,frame=false,transparent=false, backgroundColor=#00000000`
    );
  }

  return (
    <div className="flex flex-grow flex-col p-3 min-h-screen content-center">
      <div className="flex flex-grow flex-wrap justify-between">
        <div className="text-xs text-gray-800 font-semibold">
          {dateStyle.format(time)}
        </div>
        <div className="text-xs font-light">{timeStyle.format(time)}</div>
      </div>
      <div className="flex flex-grow">
        <button
          type="button"
          onClick={handleLaunchClick}
          className="w-full
          border border-transparent text-xs font-semibold
          font-medium rounded-md shadow-sm text-white
          bg-blue-500 hover:bg-blue-600 focus:outline-none
          focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
        >
          Launch SaleSpot
        </button>
      </div>
      <div className="flex flex-grow flex-wrap justify-between items-center">
        <div className="">
          <img src={logo} className="inline w-16 mr-1" alt="SaleSpot" />
          <span
            style={{ fontSize: '8px' }}
            className="inline text-xs text-gray-400 font-light"
          >
            ⌘ + Y to toggle
          </span>
        </div>
        <div className="text-gray-700">
          <CogIcon className="h-4 w-4 cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
