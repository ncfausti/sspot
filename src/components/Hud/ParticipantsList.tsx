import React, { useRef, useState, useEffect } from 'react';
import log from 'electron-log';
import defaultImg from '../../../assets/no-user.png';

interface Participant {
  id: string;
  displayName: string;
  img: string;
  talkRatio: number;
}
interface Face {
  id: string;
  x: number;
  y: number;
  label: string;
  sentiment: number;
  image_path: string;
  status: number;
  directory: string;
}

export default function ParticipantsList(props: { faces: Face[] }) {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', displayName: 'John Doe', img: defaultImg, talkRatio: 99.0 },
  ]);

  return (
    <div className="hidden sm:block z-0 w-2/3 ml-8 pl-8 min-h-screen fixed right-0 flex flex-grow flex-col bg-gray-100 content-center rounded-l-none rounded-3xl">
      <div className="font-semibold ml-3">Participants</div>
      <div className="flex w-full space-x-4 flex-grow bg-gray-100 p-6 content-center rounded-3xl  rounded-l-none">
        {props.faces.map((participant: Participant) => (
          <div key={participant.id} className="text-xs text-center">
            <img
              src={participant.image_path}
              className={`h-16 rounded-full border-4 ${
                participant.sentiment < 0
                  ? 'border-red-400'
                  : 'border-green-600'
              }`}
              alt={participant.id}
            />
            <div>{participant.label}</div>
            <div>{participant.sentiment}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
