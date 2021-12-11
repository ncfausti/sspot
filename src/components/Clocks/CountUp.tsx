import React from 'react';

export default function CountUp(props: { elapsed: number }) {
  const { elapsed } = props;
  return (
    <div>
      {Math.floor(elapsed / 60) < 10 ? '0' : ''}
      {Math.floor(elapsed / 60)}:{Math.floor(elapsed % 60) < 10 ? '0' : ''}
      {Math.floor(elapsed % 60)}
    </div>
  );
}
