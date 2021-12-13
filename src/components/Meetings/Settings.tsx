import React from 'react';

export default function Settings(props) {
  return (
    <fieldset className="space-y-0">
      <div className="relative flex items-start">
        <div className="flex items-center h-5">
          <input
            id="comments"
            aria-describedby="comments-description"
            name="comments"
            type="checkbox"
            className="focus:ring-spotblue h-4 w-4 text-spotblue border-gray-300 rounded"
          />
        </div>
        <div className="ml-3 text-xs">
          <label htmlFor="comments" className="font-medium text-gray-700">
            Auto-detect{' '}
          </label>
          <span id="comments-description" className="text-gray-500">
            <span className="sr-only">Auto-detect </span>faces when{' '}
            <span className="font-semibold">Launch SaleSpot</span> is clicked.
          </span>
        </div>
      </div>
      <div className="relative flex items-start">
        <div className="flex items-center h-5">
          <input
            id="candidates"
            aria-describedby="candidates-description"
            name="candidates"
            type="checkbox"
            className="focus:ring-spotblue h-4 w-4 text-spotblue border-gray-300 rounded"
          />
        </div>
        <div className="ml-3 text-xs">
          <label htmlFor="candidates" className="font-medium text-gray-700">
            Debug
          </label>
          <span id="candidates-description" className="text-gray-500">
            <span className="sr-only">Debug </span>
          </span>
        </div>
      </div>
      <button
        onClick={() => props.backClick()}
        className="cursor-pointer float-right text-right bg-spotblue hover:bg-blue-700 text-white font-bold text-xxs px-2 rounded"
      >
        Back
      </button>
    </fieldset>
  );
}
