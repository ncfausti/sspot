import React, { useCallback, useEffect, useState } from 'react';

export default function MeetingsList(props: { meetings: any }) {
  const { meetings } = props;
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
                {meetings.map(
                  (person: {
                    email: {} | null | undefined;
                    name:
                      | boolean
                      | React.ReactChild
                      | React.ReactFragment
                      | React.ReactPortal
                      | null
                      | undefined;
                    title:
                      | boolean
                      | React.ReactChild
                      | React.ReactFragment
                      | React.ReactPortal
                      | null
                      | undefined;
                  }) => (
                    <tr key={person.email}>
                      <td className="px-2 py-1 whitespace-nowrap text-sm font-medium text-white">
                        {person.name}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-sm text-white">
                        {person.title}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-sm text-white">
                        {person.email}
                      </td>
                      {/* <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-500">
                      {person.role}
                    </td> */}
                      {/* <td className="px-2 py-1 whitespace-nowrap text-right text-sm font-medium">
                      <a
                        href="#"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </a>
                    </td> */}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
