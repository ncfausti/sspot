/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-implied-eval */
import React, { useEffect, useState, useRef } from 'react';
import log from 'electron-log';

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

export default function MeetingAlert(props: MeetingAlertProps) {
  const [isTalking, setIsTalking] = useState(false);
  const { id, message, rules, voiceMetrics } = props;
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
          if (refTalkRatio.current.value > 40 && counter >= THRESHOLD) {
            log.info('launching some alert now');
            // open window at middle of screen under hud
            counter = -5;
          } else if (refTalkRatio.current.value > 40 && counter < THRESHOLD) {
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
