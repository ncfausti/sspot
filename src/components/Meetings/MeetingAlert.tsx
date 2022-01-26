/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-implied-eval */
import React, { useEffect, useState, useRef } from 'react';
import log from 'electron-log';
import { ipcRenderer, remote } from 'electron';

interface MeetingAlertProps {
  id: string;
  message: string;
  rules: {
    thresholdPercent: number;
    secondsUntilTrigger: number;
    showAlertForNSeconds: number;
    secondsDelayAfterTrigger: number;
  };
  voiceMetrics: {
    current_monologue: number;
    is_talking: boolean;
    longest_monologue: number;
    talk_ratio: number;
  };
}
// This componet implements the logic for the alert message
// It is to be embedded in the HUD and will be shown when the user
// talk-ratio and time-duration are above the threshold values
export default function MeetingAlert(props: MeetingAlertProps) {
  const { id, message, voiceMetrics } = props;
  const [wait, setWait] = useState(remote.getGlobal('alertWait'));

  const [timeToFire, setTimeToFire] = useState(remote.getGlobal('ttf'));
  // const [message, setMessage] = useState(remote.getGlobal('alertMsg'));
  const [threshold, setThreshold] = useState(remote.getGlobal('threshold'));

  const refTalkRatio = useRef(null);
  useEffect(() => {
    const interval = setInterval(
      ((counter) => {
        return () => {
          if (refTalkRatio.current.value > threshold && counter >= timeToFire) {
            log.info('launching some alert now');
            // open window at middle of screen under hud
            ipcRenderer.invoke('open-alert-window', {
              browserWindowParams: {
                frame: false,
                alwaysOnTop: true,
                transparent: true,
                paintWhenInitiallyHidden: false,
                webPreferences: {
                  nodeIntegration: true,
                  additionalArguments: [
                    `--USER-DATA-DIR=${remote.getGlobal('userDataDir')}`,
                  ],
                  nativeWindowOpen: false,
                  enableRemoteModule: true,
                },
                hasShadow: true,
                resizable: false,
              },
              extra: { alertId: id, message },
            });
            counter = -1 * wait;
          } else if (
            refTalkRatio.current.value > threshold &&
            counter < timeToFire
          ) {
            counter += 1;
          } else {
            counter = 0;
          }
          log.info('MeetingAlert: ');
          log.info(counter, refTalkRatio.current);
        };
      })(0),
      1000
    );
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <input type="hidden" ref={refTalkRatio} value={voiceMetrics.talk_ratio} />
    </>
  );
}
