import { io, Socket } from 'socket.io-client';

const wsBaseUrl = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

export const matchSocket: Socket = io(`${wsBaseUrl}/match`, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export const matchmakingSocket: Socket = io(`${wsBaseUrl}/realtime`, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});
