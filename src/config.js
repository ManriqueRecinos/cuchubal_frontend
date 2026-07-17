// Configuración centralizada de URLs de la API
// En desarrollo: http://localhost:3001
// En producción: Se configura con VITE_API_URL en las variables de entorno de Railway

let envApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Si el usuario olvidó poner https:// en la variable de entorno, agregarlo automáticamente
if (!envApiUrl.startsWith('http://') && !envApiUrl.startsWith('https://')) {
  envApiUrl = 'https://' + envApiUrl;
}

const API_URL = envApiUrl;

// Derivar la URL de WebSocket automáticamente desde la API_URL
const wsProtocol = API_URL.startsWith('https') ? 'wss' : 'ws';
const wsHost = API_URL.replace(/^https?:\/\//, '');
const WS_URL = `${wsProtocol}://${wsHost}`;

export { API_URL, WS_URL };
