import React, { SyntheticEvent, useEffect, useRef } from 'react';
import log from 'electron-log';

export default function Settings(props) {
  const { isAutoDetectOn, backClick, autoDetectChanged } = props;

  useEffect(() => {
    log.info('autodetect is: ', isAutoDetectOn);
  }, [isAutoDetectOn]);

  return (
    <fieldset className="space-y-0">
      <div className="relative flex items-start">
        <div className="flex items-center h-5">
          <>
            {isAutoDetectOn && (
              <input
                id="check-auto-detect"
                onChange={autoDetectChanged}
                aria-describedby="auto-detect-description"
                name="check-auto-detect"
                type="checkbox"
                checked
                className="focus:ring-spotblue h-4 w-4 text-spotblue border-gray-300 rounded"
              />
            )}
            {!isAutoDetectOn && (
              <input
                id="check-auto-detect"
                onChange={autoDetectChanged}
                aria-describedby="auto-detect-description"
                name="check-auto-detect"
                type="checkbox"
                className="focus:ring-spotblue h-4 w-4 text-spotblue border-gray-300 rounded"
              />
            )}
          </>
        </div>
        <div className="ml-3 text-xs">
          <label
            htmlFor="check-auto-detect"
            className="font-medium text-gray-700"
          >
            Auto-detect{' '}
          </label>
          <span id="auto-detect-description" className="text-gray-500">
            <span className="sr-only">Auto-detect </span>faces when{' '}
            <span className="font-semibold">Launch SaleSpot</span> is clicked.
          </span>
        </div>
      </div>
      <div className="relative flex items-start">
        <div className="flex items-center h-5">
          <input
            id="check-debug"
            aria-describedby="debug-description"
            name="check-debug"
            type="checkbox"
            className="focus:ring-spotblue h-4 w-4 text-spotblue border-gray-300 rounded"
          />
        </div>
        <div className="ml-3 text-xs">
          <label htmlFor="check-debug" className="font-medium text-gray-700">
            Debug
          </label>
          <span id="debug-description" className="text-gray-500">
            <span className="sr-only">Debug </span>
          </span>
        </div>
      </div>
      <button
        onClick={backClick}
        className="cursor-pointer float-right text-right bg-spotblue hover:bg-blue-700 text-white font-bold text-xxs px-2 rounded"
      >
        Back
      </button>
    </fieldset>
  );
}
