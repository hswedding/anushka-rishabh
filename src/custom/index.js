/* ============================================================================
 *  PER-COUPLE CUSTOM SECTIONS
 *  Put anything one couple needs that the base doesn't have (a story
 *  timeline, a photo gallery, a special ceremony scene…) in this folder, and
 *  list it below. Each entry renders after RSVP and before the footer, and
 *  receives the parsed `invite` prop (side = host.side, eventIds, guestName…).
 *
 *  Keeping one-off work here, instead of editing base files, means
 *  `git merge upstream/main` (pulling fixes from invite-base-single) stays clean.
 *
 *  Example:
 *    import OurStory from './OurStory.jsx';
 *    export default [{ id: 'our-story', Component: OurStory }];
 *
 *  Animations: import gsap from '../lib/gsap.js' and honour useReducedMotion.
 * ========================================================================== */

// Anushka & Rishabh: the Ivory & Sage colour overrides (no extra sections).
import './theme.js';

export default [];
