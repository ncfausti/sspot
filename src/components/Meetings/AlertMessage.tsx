/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-implied-eval */
import React, { useEffect, useState, useRef } from 'react';
import log from 'electron-log';
import { remote } from 'electron/renderer';
import { ipcRenderer } from 'electron';
import { useParams } from 'react-router-dom';

export default function AlertMessage() {
  const params: { aid: string } = useParams();
  log.info('AlertMessage', params.aid);
  // get the alert message and TTD from queryParams
  // or
  // store the alert message and TTD in localStorage
  // and get it from there
  useEffect(() => {
    const timeout = setTimeout(() => {
      ipcRenderer.invoke('close-alert-window', params.aid);
    }, 5000);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return <div className="p-3 h-screen dark:bg-black dark:text-white">🤫</div>;
}
