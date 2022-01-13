/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-implied-eval */
import React, { useEffect, useState, useRef } from 'react';
import log from 'electron-log';

export default function AlertMessage() {
  // get the alert message and TTD from queryParams
  useEffect(() => {
    const timeout = setTimeout(() => window.close(), 5000);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return <div className="p-3 h-screen dark:bg-black dark:text-white">🤫</div>;
}
