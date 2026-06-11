import { createRoot } from 'react-dom/client';
import App from './App';
import { SharePage } from './SharePage';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

// Route /s/:id to the share page; everything else is the main app.
const shareMatch = window.location.pathname.match(/^\/s\/([a-z0-9]{12})$/);

if (shareMatch) {
  createRoot(container).render(<SharePage id={shareMatch[1]} />);
} else {
  // StrictMode is intentionally omitted: its double-invoked mount effects
  // would acquire and immediately tear down the camera, triggering a duplicate
  // getUserMedia permission prompt.
  createRoot(container).render(<App />);
}
