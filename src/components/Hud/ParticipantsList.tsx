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
    <div className="flex flex-grow flex-col bg-gray-100 content-center rounded-xl hidden md:inline-flex md:w-1/2 rounded-l-none">
      <div className="font-semibold ml-3">Participants</div>
      <div className="flex w-full flex-grow bg-gray-100 p-6 content-center rounded-xl hidden md:inline-flex rounded-l-none">
        {props.faces.map((participant: Participant) => (
          <div key={participant.id} className="mt-3 ml-3 w-24 text-center">
            <img
              src={participant.image_path}
              className={`w-24 h-24 rounded-full border-4 ${
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
