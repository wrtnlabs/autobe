import { createContext, ReactNode, useContext, useRef, useState } from "react";

interface IDragContextType {
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  registerFileHandler: (handler: (files: FileList) => void) => void;
  handleFiles: (files: FileList) => void;
}

const DragContext = createContext<IDragContextType | null>(null);

export const AutoBePlaygroundDragProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileHandlerRef = useRef<((files: FileList) => void) | null>(null);

  const registerFileHandler = (handler: (files: FileList) => void) => {
    fileHandlerRef.current = handler;
  };

  const handleFiles = (files: FileList) => {
    fileHandlerRef.current?.(files);
  };

  return (
    <DragContext.Provider
      value={{
        isDragging,
        setIsDragging,
        registerFileHandler,
        handleFiles,
      }}
    >
      {children}
    </DragContext.Provider>
  );
};

export const useAutoBePlaygroundDrag = () => {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error(
      "useAutoBePlaygroundDrag must be used within AutoBePlaygroundDragProvider",
    );
  }
  return context;
};