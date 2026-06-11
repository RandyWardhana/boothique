import { createRoot } from 'react-dom/client';
import App from './App';
import { SharePage } from './SharePage';
import { AdminScreen } from './components/screens/AdminScreen';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

const { pathname } = window.location;
const shareMatch = pathname.match(/^\/s\/([a-z0-9]{12})$/);

if (pathname === '/admin') {
  createRoot(container).render(<AdminScreen />);
} else if (shareMatch) {
  createRoot(container).render(<SharePage id={shareMatch[1]} />);
} else {
  // StrictMode is intentionally omitted: its double-invoked mount effects
  // would acquire and immediately tear down the camera, triggering a duplicate
  // getUserMedia permission prompt.
  createRoot(container).render(<App />);
}
