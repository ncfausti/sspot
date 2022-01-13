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
  const [isTalking, setIsTalking] = useState(false);
  const { id, message, rules, voiceMetrics } = props;
  const [wait, setWait] = useState(remote.getGlobal('alertWait'));

  // log.info(id);
  // log.info(rules);
  // log.info(message);
  // log.info(voiceMetrics);

  const refTalkRatio = useRef(null);
  useEffect(() => {
    const interval = setInterval(
      ((counter) => {
        return () => {
          const THRESHOLD = 5;
          if (refTalkRatio.current.value > 10 && counter >= THRESHOLD) {
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
              extra: { id, message, rules },
            });
            counter = -1 * wait;
          } else if (refTalkRatio.current.value > 10 && counter < THRESHOLD) {
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
