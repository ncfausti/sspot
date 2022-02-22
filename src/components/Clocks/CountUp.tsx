import React from 'react';

export default function CountUp(props: { elapsed: number }) {
  const { elapsed } = props;

  // get hours minutes and seconds from elapsed time
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed - hours * 3600) / 60);
  const seconds = Math.floor(elapsed - hours * 3600 - minutes * 60);
  const formattedHours = hours < 10 ? `0${hours}` : hours;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

  return (
    <div className={`font-semibold ${hours >= 1 ? 'text-sm' : 'text-md'}`}>
      {hours >= 1 ? `${formattedHours}h ` : ''}
      {formattedMinutes}m {formattedSeconds}s
    </div>
  );
}
