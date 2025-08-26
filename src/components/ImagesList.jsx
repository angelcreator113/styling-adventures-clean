import { useEffect, useState } from 'react';
import { storage, listPages } from '@/utils/init-firebase'; // if no '@' alias, use '../utils/init-firebase'
import { ref, getDownloadURL } from 'firebase/storage';

export default function ImagesListPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const folderRef = ref(storage, 'images'); // change to the folder you want
        const collected = [];

        await listPages(folderRef, async (page) => {
          // page.items = file refs, page.prefixes = subfolders
          for (const itemRef of page.items) {
            const url = await getDownloadURL(itemRef).catch(() => null);
            collected.push({ name: itemRef.name, path: itemRef.fullPath, url });
          }
        });

        if (alive) setRows(collected);
      } catch (e) {
        if (alive) setError(String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  return (
    <section className="container" style={{ padding: '12px 16px' }}>
      <div className="dashboard-card">
        <h1 style={{ margin: 0 }}>Images {loading ? '' : `(${rows.length})`}</h1>

        {loading && <p style={{ marginTop: 8 }}>Loading…</p>}
        {error && <p style={{ marginTop: 8, color: 'crimson' }}>Error: {error}</p>}

        {!loading && !error && (
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
            {rows.map((r) => (
              <li key={r.path} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                {r.url && <img src={r.url} alt={r.name} style={{ height: 40, width: 40, objectFit: 'cover', borderRadius: 4 }} />}
                <code style={{ fontSize: 12 }}>{r.path}</code>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
