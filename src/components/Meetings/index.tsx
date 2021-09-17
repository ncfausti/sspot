/* eslint-disable react/forbid-prop-types */
import React, { useState } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CogIcon,
} from '@heroicons/react/solid';
import { useAuth } from '../../contexts/AuthContext';

import { prettyDate } from '../../utils';

export default function Meetings() {
  const { currentUser } = useAuth();
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
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Sale Spot - {currentUser.email}
          <button
            type="button"
            onClick={logout}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <span className="sr-only">Logout</span>
            <CogIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </h2>
      </div>
      <div className="w-full flex px-4 py-5 sm:p-6">
        <span className="w-full relative z-0 inline-flex shadow-sm rounded-md">
          <div className="w-full bg-white w-full flex shadow sm:rounded-lg">
            <div className="w-full px-4 py-5 sm:p-6">
              <span className="relative z-0 inline-flex shadow-sm rounded-md">
                <button
                  type="button"
                  onClick={showPrev}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="-ml-px relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </span>
              <div>
                {prettyDate(
                  eventList[meetingIndex % eventList.length].startDate
                )}
              </div>

              <div className="w-full mt-5">
                <div className="w-full rounded-md px-6 py-5 inline-flex sm:items-start sm:justify-between">
                  <div className="w-full rounded-l-md p-4  border border-gray-300 sm:flex sm:items-start">
                    <span>
                      {eventList[meetingIndex % eventList.length].startTime}
                    </span>
                    <div className="mt-3 sm:mt-0 sm:ml-4">
                      <span className="relative z-0 inline-flex shadow-sm rounded-md">
                        {/* setup function to parse from recordingEnabled to select buttons */}
                        <button
                          type="button"
                          className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          All
                        </button>
                        <button
                          type="button"
                          className="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          Me
                        </button>
                        <button
                          type="button"
                          className="-ml-px relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          None
                        </button>
                      </span>{' '}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="-ml-px relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>
        </span>
      </div>
      <div className="px-4 py-4 sm:px-6">
        <button
          type="button"
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Start
        </button>
      </div>
    </div>
  );
}
