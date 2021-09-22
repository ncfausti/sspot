/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import React from 'react';

export default function Hud() {
  return (
    <div className="min-h-screen py-6 flex flex-col justify-center sm:py-12">
      <div className="w-full text-centerrelative py-3 sm:max-w-xl sm:mx-auto">
        <div className="w-full bg-green-900 p-6 rounded-full">
          <div className="w-full bg-green-400 p-4 rounded-full">
            <div className="flex justify-between w-full bg-green-100 rounded-full">
              <div className="w-36 bg-white p-6 rounded-full text-center">
                0:45
                <br />
                Time Elapsed
              </div>
              <div className="w-24 bg-white p-6 rounded-full text-center -mb-6 mt-12">
                <div className="text-2xl">75</div>
                Score
              </div>
              <div className="w-36 bg-white p-6 rounded-full text-center">
                114 WPM
                <br />
                Talk
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
