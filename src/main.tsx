import { createRoot } from 'react-dom/client';
import App from './App';
import { SharePage } from './SharePage';
import { NotFoundPage } from './NotFoundPage';
import { AdminScreen } from './components/screens/AdminScreen';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

// Skin/frame admin console. Deliberately an obscure, unguessable path so it
// isn't reachable by casually typing /admin. This is only a second layer — the
// real security boundary is the Worker's ADMIN_SECRET (every mutation requires
// it). Same rationale as EXPORT_PATH in worker/src/index.ts. Change the slug to
// rotate it. Note: this string ships in the JS bundle, so it deters casual
// pokers, not someone reading the deployed code; lean on ADMIN_SECRET for that.
const ADMIN_PATH = '/console/moderator';

const { pathname } = window.location;
const shareMatch = pathname.match(/^\/s\/([a-z0-9]{12})$/);

if (pathname === ADMIN_PATH) {
  createRoot(container).render(<AdminScreen />);
} else if (shareMatch) {
  createRoot(container).render(<SharePage id={shareMatch[1]} />);
} else if (pathname === '/') {
  // StrictMode is intentionally omitted: its double-invoked mount effects
  // would acquire and immediately tear down the camera, triggering a duplicate
  // getUserMedia permission prompt.
  createRoot(container).render(<App />);
} else {
  // Any other path is unknown — the SPA rewrite serves index.html for every
  // URL, so an on-theme 404 beats silently dropping the user into the booth.
  createRoot(container).render(<NotFoundPage />);
}
