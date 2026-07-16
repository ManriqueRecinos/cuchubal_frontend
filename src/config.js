// Configuración centralizada de URLs de la API
// En desarrollo: http://localhost:3001
// En producción: Se configura con VITE_API_URL en las variables de entorno de Railway

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Derivar la URL de WebSocket automáticamente desde la API_URL
const wsProtocol = API_URL.startsWith('https') ? 'wss' : 'ws';
const wsHost = API_URL.replace(/^https?:\/\//, '');
const WS_URL = `${wsProtocol}://${wsHost}`;

export { API_URL, WS_URL };
