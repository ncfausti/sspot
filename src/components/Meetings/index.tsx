/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react';
import { CogIcon } from '@heroicons/react/solid';
import log from 'electron-log';
import logo from '../../../assets/salespot-logo-red.png';
// import { useAuth } from '../../contexts/AuthContext';
// import { prettyDate } from '../../utils';

export default function Meetings() {
  // const { currentUser } = useAuth();
  log.info('in meetings');
  // const [meetingIndex] = useState(0);
  // const [eventList, setEventList] = useState([
  //   { startTime: '10:00AM', startDate: '1/1/2000', id: -1 },
  // ]);
  // const { logout } = useAuth();

  // function showPrev() {
  //   setEventList((prevState) => ({
  //     meetingIndex:
  //       prevState.meetingIndex - 1 >= 0 ? prevState.meetingIndex - 1 : 0,
  //   }));
  // }

  // function showNext() {
  //   setEventList((prevState) => ({
  //     meetingIndex:
  //       prevState.meetingIndex + 1 < prevState.eventList.length
  //         ? prevState.meetingIndex + 1
  //         : prevState.meetingIndex,
  //   }));
  // }

  function handleJoinClick() {
    log.info('clicked join');
    window.open(
      `file://${__dirname}/index.html#/live`,
      '_blank',
      `top=80,left=200,frame=false,transparent=true, backgroundColor=#00000000`
    );
  }
  const [time, setTime] = useState(new Date());

  useEffect(() => {
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
    // timeStyle: 'short',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
  });

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
