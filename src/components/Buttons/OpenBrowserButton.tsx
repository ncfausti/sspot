import React from 'react';
import { shell } from 'electron';

export default function OpenBrowserButton(props: {
  uri: string;
  text: string;
}) {
  const { uri, text } = props;
  const buttonTextDefault = '<SPECIFY A URI/TEXT>';
  return (
    <button
      type="button"
      onClick={() => shell.openExternal(uri)}
      className={`group relative w-full flex justify-center py-2 px-4
      border border-transparent text-sm font-medium rounded-full
      text-white bg-spotblue focus:outline-none`}
    >
      <span className="absolute left-0 inset-y-0 flex items-center pl-3" />
      {text || buttonTextDefault}
    </button>
  );
}
