/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import React from 'react';

export default function Hud() {
  return (
    <div className="flex flex-col justify-center">
      <div className="w-full text-centerrelative py-3 sm:max-w-xl sm:mx-auto">
        <div className="w-full bg-gray-600 p-4 rounded-full">
          <div className="flex justify-between h-24 w-full bg-gray-600 rounded-full">
            <div className="w-36 bg-gray-400 text-white p-3 rounded-full text-center">
              0:45
              <br />
              Time Elapsed
            </div>
            <div className="w-32 h-32 bg-green-400 text-white p-6 rounded-full text-center -mb-12 mt-12 border-8 border-gray-600">
              <div className="text-2xl">75</div>
              Score
            </div>
            <div className="w-36 bg-gray-400 text-white p-3 rounded-full text-center">
              114 WPM
              <br />
              Talk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
