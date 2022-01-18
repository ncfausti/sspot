import React from 'react';
import { XIcon } from '@heroicons/react/solid';

export default function Release() {

  return (
    <div className="p-5 h-screen bg-gray-100 text-black dark:bg-black dark:text-white">

      <div className="flex justify-between border-b">
        <h1 className="text-xl">Release Notes <span className="text-sm">v0.9.0</span></h1>
        <XIcon
          className="cursor-pointer w-5 h-5 dark:text-white hover:dark:text-gray-400"
          onClick={() => window.close()}
        />
      </div>
      <ul className="p-5 list-disc text-sm">
        <li>Update to participant windows layout</li>
        <li>Redesign settings tab layout</li>
        <li>Logo updated</li>
      </ul>
    </div>
  );
}
