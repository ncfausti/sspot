/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { XCircleIcon } from '@heroicons/react/solid';

export default function Error(props) {
  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />O
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{props.message}</h3>
        </div>
      </div>
    </div>
  );
}
