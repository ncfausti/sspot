import React, { useCallback, useEffect, useState } from 'react';
import log from 'electron-log';
import calendarIcon from '../../../assets/calendar.png';

export default function MeetingsList(props: { meetings: any }) {
  const { meetings } = props;
  // log.info('IN MEETINGS LIST: ');
  // log.info(meetings);
  const dateStyle = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStyle = new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: 'numeric',
  });

  if (meetings.length >= 1) {
    log.info(meetings.length);
    log.info(meetings[0]);
    meetings[0].forEach((meeting) => log.info(meeting.summary));
  }
  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-gray-200 sm:rounded-lg">
            <table className="bg-black min-w-full my-3 divide-y borderdivide-gray-200">
              <thead className="bg-spotgray">
                <tr className="">
                  <th
                    scope="col"
                    className="px-2 py-1 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Today
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-1 text-left text-xs font-medium text-white uppercase tracking-wider"
                  />
                  <th
                    scope="col"
                    className="px-2 py-1 text-left text-xs font-medium text-white uppercase tracking-wider"
                  />
                  <th
                    scope="col"
                    className="px-2 py-1 text-left text-xs font-medium text-white uppercase tracking-wider"
                  />
                  <th scope="col" className="relative px-2 py-1">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-spotgray  divide-y divide-gray-200">
                {meetings.length >= 1 &&
                  meetings[0].map((meeting) => (
                    <tr key={meeting.id}>
                      <td className="px-2 py-1 whitespace-nowrap text-sm font-medium text-white">
                        {timeStyle
                          .format(new Date(meeting.start.dateTime))
                          .slice(0, -3)}
                        -{timeStyle.format(new Date(meeting.end.dateTime))}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-sm text-white">
                        {meeting.summary}
                        <img
                          src={calendarIcon}
                          className="inline float-right h-4 w-4"
                          alt="Calendar Icon"
                        />
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-sm text-white" />
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
