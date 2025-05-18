import React from "react";

export default function TailwindTest() {
  return (
    <div className="flex items-center max-w-sm p-6 mx-auto space-x-4 bg-white shadow-md rounded-xl">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center w-12 h-12 font-bold text-white bg-blue-500 rounded-full">
          T
        </div>
      </div>
      <div>
        <div className="text-xl font-medium text-red-500">
          Tailwind CSS Working!
        </div>
        <p className="text-gray-500">
          This component demonstrates Tailwind CSS styles
        </p>
      </div>
    </div>
  );
}
