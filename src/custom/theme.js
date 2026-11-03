/* Ivory & Sage theme for Anushka & Rishabh — kept in src/custom so base files
   stay untouched. Loads the colour overrides and re-tints the falling petals.
   The rain reads its colours when it starts, after this module has run. */
import './theme.css';
import { COLORS } from '../components/Petals.jsx';

COLORS.splice(0, COLORS.length,
  ['#d8ceb4', '#fbf8ef'], // ivory petal
  ['#d4a933', '#f7e3a1'], // gold petal
  ['#8fa37e', '#d3dec7'], // sage leaf
  ['#a6b697', '#e6ecdf'], // pale sage
);
