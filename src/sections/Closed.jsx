import { orderedCouple } from '../lib/config.js';
import Icon from '../components/Icons.jsx';

/* Shown for the bare site root and any link that isn't a valid invitation —
   guests only ever reach their own variant through the full link they got. */
export default function Closed() {
  const [first, second] = orderedCouple();
  return (
    <main className="closed">
      <Icon name="lotus" size={34} className="closed__crest" />
      <h1 className="display closed__names">
        {first.first} <span className="hero__amp">&amp;</span> {second.first}
      </h1>
      <p className="closed__msg">
        This invitation opens from the personal link you received.
        Please use that link to view it.
      </p>
    </main>
  );
}
