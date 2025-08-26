// src/pages/StorageSmoke.jsx
import { useEffect, useState } from 'react';
import { storage, listPages } from '@/utils/init-firebase-data';
import { ref } from 'firebase/storage';

export default function StorageSmoke() {
  const [state, setState] = useState({ items: 0, prefixes: 0, err: '' });

  useEffect(() => {
    const run = async () => {
      try {
        const r = ref(storage, 'images');            // adjust folder if needed
        let items = 0, prefixes = 0;
        await listPages(r, page => {
          items += page.items.length;
          prefixes += page.prefixes.length;
        });
        setState({ items, prefixes, err: '' });
      } catch (e) {
        setState({ items: 0, prefixes: 0, err: String(e) });
      }
    };
    run();
  }, []);

  return (
    <section className="container" style={{ padding: 16 }}>
      <h2>Storage smoke</h2>
      {state.err ? (
        <pre style={{ color: 'crimson' }}>{state.err}</pre>
      ) : (
        <div>items: {state.items} — prefixes: {state.prefixes}</div>
      )}
    </section>
  );
}
