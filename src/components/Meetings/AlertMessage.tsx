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
  const timeoutMs =
    params.alertId.indexOf('disclaimer') >= 0 ||
    params.alertId.indexOf('instructions') >= 0
      ? 10000000
      : 5000;

  // AutoDetectDisclaimer -> red, disclaimer message, include close button
  // SpottingDisclaimer -> red, disclaimer, no close button

  // if alertId === 'disclaimer'
  // set text to white, text to text-xs, bg-color to red

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
      className={`pt-[6px] text-xs text-white text-center h-screen font-semibold ${
        params.alertId.indexOf('disclaimer') >= 0
          ? 'bg-red-400'
          : 'bg-spotgrayltst'
      } rounded-hud`}
    >
      {params.alertId.indexOf('spotting-instructions') >= 0 &&
        'Click on a participant to add to spot.'}
      {params.alertId.indexOf('disclaimer') >= 0 &&
        'By spotting someone, you are confirming that they consent to being recorded.'}
      {params.alertId.indexOf('disclaimer') === -1 &&
        params.alertId.indexOf('instruction') === -1 &&
        message}
      {params.alertId.indexOf('autodetect-disclaimer') >= 0 && (
        <XIcon
          className="inline cursor-pointer w-5 h-5 dark:text-white hover:dark:text-gray-400"
          onClick={() => {
            ipcRenderer.send('remove-alert', params.alertId);
            window.close();
          }}
        />
      )}
    </div>
  );
}
