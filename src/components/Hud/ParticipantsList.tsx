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

  // function delayedDisplay(diff: number) {
  //   const show = diff < 20;
  //   return setTimeout(() => (show ? 'w-full' : 'w-1/2'), 2000);
  // }
  return (
    <div
      className="z-0 fixed fixed left-0 shadow-hud min-h-[110px] flex flex-grow flex-end bg-gray-100 content-center rounded-hud"
      style={{ width: `${width}px` }}
    >
      <div className="flex flex-wrap w-1/2 justify-evenly p-3 pl-1 mr-1 fixed right-0">
        <div
          className={`w-full font-semibold text-center ${
            widthDiff > 20 ? '' : 'hidden'
          }`}
        >
          Participants: <span className="text-spotred">({faces.length})</span>
        </div>
        {faces.map((face: Face, index: number) => (
          <div
            key={face.id}
            className="text-sm text-center relative hover-trigger"
            onClick={faceClicked}
          >
            <span
              id={face.id}
              style={{
                position: 'absolute',
                right: '-12px',
                top: '-3px',
              }}
              className="absolute bg-gray-400 text-tiny text-gray-900 w-4 h-4 transparent -right-2 -top-1.5 rounded-full hover-target cursor-pointer"
            >
              <div
                className="text-white"
                style={{
                  position: 'absolute',
                  left: '5px',
                  bottom: '0px',
                }}
              >
                x
              </div>
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
