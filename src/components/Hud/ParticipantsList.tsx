import React from 'react';

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
  const { faces } = props;
  const break = {
    /* Inserting this collapsed row between two flex items will make
    * the flex item that comes after it break to a new row */
     flexBasis: '100%',
     height: 0,
   }
  return (
    <div className="z-0 w-1/2 min-h-screen fixed right-0 flex flex-grow flex-col bg-gray-100 content-center rounded-l-none rounded-2xl">
      <div className="bg-gray-200 flex justify-evenly flex-wrap w-full min-h-screen bg-gray-100 p-1 rounded-2xl rounded-l-none">
        {faces.map((face: Face, index: number) => (
          <div key={face.id} className="text-xxs text-center">
            <img
              src={face.image_path}
              className={`w-10 rounded-full border-4 ${
                face.sentiment >= 20 ? 'border-green-600' : 'border-gray-300'
              }`}
              alt={face.id}
            />
            {/* <div>{face.label}</div> */}
            <div className={`pl-1 w-10 rounded-full font-semibold ${
                face.sentiment > 20 ? 'text-green-600' : 'text-gray-900'
              }`}>{face.sentiment <= 0 || !face.sentiment ? '0%' : face.sentiment + '%'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
