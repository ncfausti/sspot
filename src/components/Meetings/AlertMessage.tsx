/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-implied-eval */
import React, { useEffect, useState, useRef } from 'react';
import { ipcRenderer, remote } from 'electron';
import { useParams } from 'react-router-dom';
import log from 'electron-log';
import { XIcon } from '@heroicons/react/solid';

export default function AlertMessage() {
  const params: { alertId: string } = useParams();
  const [message, setMessage] = useState(remote.getGlobal('alertMsg'));
  const timeoutMs = params.alertId === 'autodetect-disclaimer' ? 1000000 : 5000;

  // AutoDetectDisclaimer -> red, disclaimer message, include close button
  // SpottingDisclaimer -> red, disclaimer, no close button

  // if alertId === 'disclaimer'
  // set text to white, text to text-xs, bg-color to red
  const disclaimerClass = 'text-xs bg-red-400 text-white';
  log.info(params);
  useEffect(() => {
    const timeout = setTimeout(() => {
      ipcRenderer.invoke('close-alert-window', params.alertId);
    }, timeoutMs);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      className={`pt-[6px] text-center h-screen font-semibold ${disclaimerClass} rounded-hud`}
    >
      {params.alertId === 'autodetect-disclaimer' &&
        'By spotting someone, you are confirming that they consent to being recorded.'}
      {params.alertId !== 'autodetect-disclaimer' && message}
      {params.alertId === 'autodetect-disclaimer' && (
        <XIcon
          className="cursor-pointer w-5 h-5 dark:text-white hover:dark:text-gray-400"
          onClick={() => {
            ipcRenderer.send('remove-alert', params.alertId);
            window.close();
          }}
        />
      )}
    </div>
  );
}
