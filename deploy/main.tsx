import { createRoot } from 'react-dom/client';
import Page from '../app/page';
import '../app/globals.css';

// The Vercel entry uses the same page, styles and simulation as local Vinext.
// All lab navigation and learner state already live in the browser.
createRoot(document.getElementById('root')!).render(<Page />);
