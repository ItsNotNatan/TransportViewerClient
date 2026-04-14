// src/pages/MedidorCargas/constants.js
import transportIcon from '../../assets/transport.png';

export const VEHICLES = [
  { id: 'fiorino', name: 'Fiorino', icon: '🚐', L: 1.60, W: 1.30, H: 1.10, vol: 2.3, type: 'small' },
  { id: 'van', name: 'VAN/Sprinter', icon: '🚌', L: 3.30, W: 1.70, H: 1.80, vol: 10.0, type: 'van' },
  { id: 'vuc', name: 'VUC', icon: '🚛', L: 4.50, W: 2.20, H: 2.20, vol: 21.7, type: 'truck' },
  { id: '34', name: 'Cam. 3/4', icon: '🚚', L: 5.50, W: 2.20, H: 2.30, vol: 27.8, type: 'truck' },
  { id: 'truck7', name: 'Truck 7,5m', icon: '🚛', L: 7.50, W: 2.45, H: 2.50, vol: 45.9, type: 'truck' },
  { id: 'truck8', name: 'Truck 8m', icon: '🚛', L: 8.00, W: 2.45, H: 2.60, vol: 50.9, type: 'truck' },
  { id: 'car10', name: 'Carreta 10m', icon: '🚛', L: 10.0, W: 2.45, H: 2.60, vol: 63.7, type: 'semi' },
  { id: 'car12', name: 'Carreta 12m', icon: '🚛', L: 12.0, W: 2.45, H: 2.70, vol: 79.3, type: 'semi' },
  { id: 'car15', name: 'Carreta 15m', icon: '🚛', L: 15.0, W: 2.45, H: 2.80, vol: 102.9, type: 'semi' },
  { id: 'sider', name: 'Sider', icon: '🚛', L: 14.5, W: 2.50, H: 2.70, vol: 97.8, type: 'sider' },
  { id: 'ddeck', name: 'Double Deck', icon: transportIcon, L: 14.5, W: 2.45, H: 4.00, vol: null, type: 'ddeck' }
];

export const PALETTE = ['#00d4ff', '#00e676', '#ff6b35', '#ffd600', '#ff4444', '#cc44ff', '#ff69b4', '#7fff00'];
export const GAP = 0.10;

export const getGC = (type) => {
  const map = { small: 0.28, van: 0.40, truck: 0.55, semi: 0.72, sider: 0.72, ddeck: 0.72 };
  return map[type] || 0.55;
};

// Créditos conforme solicitado anteriormente
export const ICON_ATTRIBUTION = 'Transportation icons created by Roundicons Premium - Flaticon';
export const ICON_ATTRIBUTION_URL = 'https://www.flaticon.com/free-icons/transportation';