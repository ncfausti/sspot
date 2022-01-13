/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-implied-eval */
import React, { useEffect, useState, useRef } from 'react';
import log from 'electron-log';
import { ipcRenderer, remote } from 'electron';
import { useParams } from 'react-router-dom';

export default function AlertMessage() {
  const params: { aid: string } = useParams();
  // log.info('AlertMessage', params.aid);
  // get the alert message and TTD from queryParams
  // or
  // store the alert message and TTD in localStorage
  // and get it from there

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
    <div className="pt-[3px] text-center h-screen text-3xl dark:bg-black dark:text-white flux">
      {/* <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Monoton&effect=neon"
      /> */}
      {message}
    </div>
  );
}
