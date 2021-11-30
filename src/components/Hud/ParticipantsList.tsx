import React, { useRef, useState, useEffect } from 'react';
import log from 'electron-log';
import defaultImg from '../../../assets/no-user.png';

interface Participant {
  id: string;
  displayName: string;
  img: string;
  talkRatio: number;
}

export default function ParticipantsList() {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', displayName: 'John Doe', img: defaultImg, talkRatio: 99.0 },
  ]);
  return (
    <div className="flex flex-grow flex-col bg-gray-100 p-6 content-center rounded-xl hidden md:inline-flex md:w-1/2 rounded-l-none">
      <div className="font-semibold">Participants</div>
      {participants.map((participant: Participant) => (
        <div key={participant.id} className="mt-3 w-24 text-center">
          <img
            src={participant.img}
            className="w-24 h-24"
            alt={participant.displayName}
          />
          <div>{participant.talkRatio}%</div>
        </div>
      ))}
    </div>
  );
}
