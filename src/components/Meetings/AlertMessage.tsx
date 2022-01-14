/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-implied-eval */
import React, { useEffect, useState, useRef } from 'react';
import log from 'electron-log';
import { ipcRenderer, remote } from 'electron';
import { useParams } from 'react-router-dom';

export default function AlertMessage() {
  const params: { aid: string } = useParams();
  const [message, setMessage] = useState(remote.getGlobal('alertMsg'));

  useEffect(() => {
    const timeout = setTimeout(() => {
      ipcRenderer.invoke('close-alert-window', params.aid);
    }, 5000);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="pt-[6px] text-center h-screen text-xl dark:bg-black dark:text-white flux rounded-hud">
      {message}
    </div>
  );
}
