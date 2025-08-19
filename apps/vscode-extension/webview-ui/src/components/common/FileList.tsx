import React from "react";

interface IFileListProps {
  title: string;
  files: string[];
  theme: "blue" | "green" | "purple" | "orange";
}

const FileList = ({ title, files, theme }: IFileListProps) => {
  const themeColors = {
    blue: "bg-blue-400",
    green: "bg-green-400",
    purple: "bg-purple-400",
    orange: "bg-orange-400",
  };

  const color = themeColors[theme];

  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-100">
      <div className="text-sm text-gray-700 mb-2">
        <span className="font-medium text-gray-600">{title}:</span>
      </div>
      <div className="space-y-1">
        {files.map((filename, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className={`w-1 h-1 ${color} rounded-full`}></div>
            <span className="text-xs text-gray-600">{filename}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
