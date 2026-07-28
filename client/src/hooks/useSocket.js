import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL;

export const useSocket = () => {
  const socketRef = useRef(null);

  if (!socketRef.current) {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
    });
  }

  useEffect(() => {
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return socketRef.current;
};