import React, { SyntheticEvent } from 'react';
import log from 'electron-log';

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

export default function ParticipantsList(props: {
  faces: Face[];
  faceClickHandler: (string) => void;
}) {
  const { faces, faceClickHandler } = props;
  const HUD_STARTING_WIDTH = 175;
  const HUD_EXPANDED_WIDTH = 340;
  const HUD_STARTING_HEIGHT = 120;
  const mainHudWidth = 165;
  const mainHudHeight = 110;

  const faceClicked = (e: SyntheticEvent) => {
    // use the id value stored in the alt attribute
    // to get the face id
    faceClickHandler(e.target.id);
  };

  const widthDiff = Math.abs(window.outerWidth - HUD_STARTING_WIDTH);
  const width = widthDiff < 20 ? mainHudWidth : 330;

  return (
    <div
      className={`z-0 fixed fixed left-0 w-[${width}px] shadow-hud min-h-[110px] flex flex-grow flex-end bg-gray-100 content-center rounded-hud`}
    >
      <div className="flex justify-evenly flex-wrap w-1/2 fixed right-0">
        {faces.map((face: Face, index: number) => (
          <div
            key={face.id}
            className="text-xxs text-center relative hover-trigger"
            onClick={faceClicked}
          >
            <span
              id={face.id}
              className="absolute text-tiny text-gray-900 w-4 h-4 font-semibold transparent -right-2 -top-1.5 rounded-full hover-target cursor-pointer"
            >
              x
            </span>
            <img
              src={face.image_path}
              className={`w-10 rounded-full border-4 ${
                face.sentiment >= 20 ? 'border-green-600' : 'border-gray-300'
              }`}
              alt={face.id}
            />
            {/* <div>{face.label}</div> */}
            <div
              className={`pl-1 w-10 rounded-full font-semibold ${
                face.sentiment > 20 ? 'text-green-600' : 'text-gray-900'
              }`}
            >
              {face.sentiment <= 0 || !face.sentiment
                ? '0%'
                : `${face.sentiment}%`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
