import { io } from 'socket.io-client';

// Socket.io configuration
const SOCKET_CONFIG = {
  url: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
  namespace: '/notifications',
  options: {
    autoConnect: false, // Don't connect automatically
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000,
    forceNew: true,
  }
};

// Create socket instance
let socket = null;

/**
 * Initialize Socket.io connection with JWT token
 */
export const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  const socketUrl = `${SOCKET_CONFIG.url}${SOCKET_CONFIG.namespace}`;
  
  socket = io(socketUrl, {
    ...SOCKET_CONFIG.options,
    auth: {
      token: token
    },
    extraHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('🚀 Socket.io connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('👋 Socket.io disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket.io connection error:', error.message);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Socket.io reconnected after', attemptNumber, 'attempts');
  });

  socket.on('reconnect_error', (error) => {
    console.error('❌ Socket.io reconnection error:', error.message);
  });

  return socket;
};

/**
 * Get current socket instance
 */
export const getSocket = () => {
  return socket;
};

/**
 * Connect socket if not already connected
 */
export const connectSocket = () => {
  if (socket && !socket.connected) {
    socket.connect();
  }
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = () => {
  return socket && socket.connected;
};

export default {
  initializeSocket,
  getSocket,
  connectSocket,
  disconnectSocket,
  isSocketConnected
};
