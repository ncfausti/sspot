import React, { useState } from 'react';
import { Switch } from '@headlessui/react';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ToggleButton(props: {
  isEnabled: boolean;
  size: 'sm' | 'lg';
  onChangeCallback: (value: boolean) => void;
}) {
  const { isEnabled, size, onChangeCallback } = props;
  const [enabled, setEnabled] = useState(isEnabled);

  const slideH = size === 'sm' ? '4' : '6';
  const slideW = size === 'sm' ? '8' : '11';

  const circleH = size === 'sm' ? '3' : '5';
  const circleW = size === 'sm' ? '3' : '5';

  function handleChange() {
    setEnabled((prev) => {
      onChangeCallback(!prev);
      return !prev;
    });
  }

  return (
    <Switch
      checked={isEnabled}
      onChange={() => handleChange()}
      className={classNames(
        enabled ? 'bg-spotblue' : 'bg-gray-200',
        `relative inline-flex flex-shrink-0 h-${slideH} w-${slideW} border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-spotblue`
      )}
    >
      <span className="sr-only">Use setting</span>
      <span
        className={classNames(
          enabled ? `translate-x-4` : 'translate-x-0',
          `pointer-events-none relative inline-block h-${circleH} w-${circleW} rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`
        )}
      >
        <span
          className={classNames(
            enabled
              ? 'opacity-0 ease-out duration-100'
              : 'opacity-100 ease-in duration-200',
            'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity'
          )}
          aria-hidden="true"
        >
          <svg
            className="h-3 w-3 text-gray-400"
            fill="none"
            viewBox="0 0 12 12"
          >
            <path
              d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span
          className={classNames(
            enabled
              ? 'opacity-100 ease-in duration-200'
              : 'opacity-0 ease-out duration-100',
            'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity'
          )}
          aria-hidden="true"
        >
          <svg
            className="h-3 w-3 text-spotblue"
            fill="currentColor"
            viewBox="0 0 12 12"
          >
            <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
          </svg>
        </span>
      </span>
    </Switch>
  );
}