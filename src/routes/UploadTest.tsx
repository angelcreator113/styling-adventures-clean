// src/routes/UploadTest.tsx
import { useState } from 'react';
import { uploadFile } from '../lib/storage';

export default function UploadTest() {
  const [msg, setMsg] = useState('');

  return (
    <form>
      <label htmlFor="file">Choose a file to upload</label>
      <input
        id="file"
        name="file"
        type="file"
        onChange={async e => {
          const f = e.currentTarget.files?.[0];
          if (!f) return;
          setMsg('Uploading…');
          try {
            const { key, url } = await uploadFile(f);
            setMsg(`OK: ${key}\n${url}`);
          } catch (err: any) {
            setMsg(`Error: ${err?.code || ''} ${err?.message || err}`);
          }
        }}
      />
      <pre>{msg}</pre>
    </form>
  );
}
