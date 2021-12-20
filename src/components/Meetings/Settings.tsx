import React, { SyntheticEvent, useEffect, useRef } from 'react';
import { ipcRenderer } from 'electron';
import log from 'electron-log';

const showDebugMode = () => {
  return (
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
  );
};

export default function Settings(props) {
  const { isAutoDetectOn, backClick, autoDetectChanged } = props;

  const exitApp = () => {
    ipcRenderer.send('close-me');
  };

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
      <div className={`${true && 'hidden'} relative flex items-start`}>
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
            Debug mode
          </label>
          <span id="debug-description" className="text-gray-500">
            <span className="sr-only">Debug </span>
          </span>
        </div>
      </div>
      <div className="pt-5">
        <button
          onClick={backClick}
          className="cursor-pointer float-right text-right bg-spotblue hover:bg-blue-700 text-white font-bold text-xxs py-1 px-2 rounded"
        >
          Back
        </button>

        <button
          onClick={exitApp}
          className="cursor-pointer float-right text-right mr-3 bg-spotred hover:bg-red-800 text-white font-bold text-xxs py-1 px-2 rounded"
        >
          Quit
        </button>
        <div className="text-xxs float-left ml-8 text-gray-300">v0.7.3</div>
      </div>
    </fieldset>
  );
}
