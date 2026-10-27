import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import 'react-phone-number-input/style.css';
import './styles/base.css';
import './styles/components.css';
import App from './App.jsx';
import Closed from './sections/Closed.jsx';
import { parseRoute } from './lib/config.js';
import { site } from './data.js';

// Hosts only — kept out of the bundle every guest downloads.
const Builder = lazy(() => import('./sections/Builder.jsx'));

const route = parseRoute(window.location.pathname);
// The builder's live preview loads the invitation in an iframe at #preview.
const preview = window.location.hash === '#preview';

// Cloudflare Web Analytics counts guests opening an invitation only — not the
// builder, its preview or the closed page.
if (route.page === 'invite' && !preview && site.cloudflareAnalyticsToken) {
  const beacon = document.createElement('script');
  beacon.defer = true;
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.dataset.cfBeacon = JSON.stringify({ token: site.cloudflareAnalyticsToken });
  document.head.appendChild(beacon);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {route.page === 'builder' ? <Suspense><Builder /></Suspense>
      : route.page === 'invite' ? <App invite={route.invite} preview={preview} />
      : <Closed />}
  </StrictMode>
);
