/* eslint-disable react/forbid-prop-types */
import React, { useState } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CogIcon,
} from '@heroicons/react/solid';
import log from 'electron-log';

import { useAuth } from '../../contexts/AuthContext';
import { prettyDate } from '../../utils';

export default function Meetings() {
  // const { currentUser } = useAuth();
  const [meetingIndex] = useState(0);
  const [eventList, setEventList] = useState([
    { startTime: '10:00AM', startDate: '1/1/2000', id: -1 },
  ]);
  const { logout } = useAuth();

  function showPrev() {
    setEventList((prevState) => ({
      meetingIndex:
        prevState.meetingIndex - 1 >= 0 ? prevState.meetingIndex - 1 : 0,
    }));
  }

  function showNext() {
    setEventList((prevState) => ({
      meetingIndex:
        prevState.meetingIndex + 1 < prevState.eventList.length
          ? prevState.meetingIndex + 1
          : prevState.meetingIndex,
    }));
  }

  function handleJoinClick() {
    log.info('clicked join');
    window.open(
      `file://${__dirname}/index.html#/live`,
      '_blank',
      `top=80,left=200,frame=false,transparent=true, backgroundColor=#00000000`
    );
  }
  return (
    <div className="flex flex-grow flex-col bg-red-100">
      <div className="flex flex-grow bg-blue-100 flex-wrap justify-between">
        <div className="bg-blue-300">1</div>
        <div className="bg-red-300">2</div>
      </div>
      <div className="flex flex-grow">
        <button
          type="button"
          className="w-full px-3 py-2
          border border-transparent text-sm leading-4
          font-medium rounded-md shadow-sm text-white
          bg-blue-600 hover:bg-blue-700 focus:outline-none
          focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Launch SaleSpot
        </button>
      </div>
      <div className="flex flex-grow flex-wrap justify-between">
        <div className="bg-blue-300">1</div>
        <div className="bg-red-300">2</div>
      </div>
    </div>
  );
}
