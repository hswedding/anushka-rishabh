/* Ivory & Sage theme for Anushka & Rishabh — kept in src/custom so base files
   stay untouched. Loads the colour overrides and re-tints the falling petals
   (which the scratch card's burst also uses). The rain reads its colours when
   it starts, after this module has run. */
import './theme.css';
import { COLORS } from '../components/Petals.jsx';

COLORS.splice(0, COLORS.length,
  ['#d8ceb4', '#fbf8ef'], // ivory petal
  ['#c6b68c', '#f2ead6'], // champagne petal
  ['#8fa37e', '#d3dec7'], // sage leaf
  ['#a6b697', '#e6ecdf'], // pale sage
);
