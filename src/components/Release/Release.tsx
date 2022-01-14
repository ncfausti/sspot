import React from 'react';

export default function Release() {

  return (
    <div className="p-5 h-screen bg-gray-100 text-black dark:bg-black dark:text-white">
      <h1 className="text-xl">Release Notes <span className="text-sm">v0.8.0</span></h1>
      <ul className="p-5 list-disc text-sm">
        <li>Added controls in settings to set custom alerts when in a meeting</li>
        <li>Fixed spacing of participant windows</li>
      </ul>
      <button
          type="button"
          onClick={()=>window.close()}
          className="cursor-pointer float-right text-right bg-spotblue hover:bg-blue-700 text-white font-bold text-xxs py-1 px-2 rounded"
        >
          Back
        </button>
    </div>
  );
}
