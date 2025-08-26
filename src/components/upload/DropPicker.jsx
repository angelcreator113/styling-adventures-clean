// src/components/upload/DropPicker.jsx
import React, { useRef, useState } from "react";

export default function DropPicker({ accept = "image/*", onFiles, onOpenCamera }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const pick = () => inputRef.current?.click();

  const onChange = (e) => onFiles?.(Array.from(e.target.files || []));

  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDrag(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) onFiles?.(files);
  };

  return (
    <>
      <div
        className={`drop-zone ${drag ? "is-drag" : ""}`}
        onClick={pick}
        onDragOver={(e)=>{e.preventDefault(); setDrag(true);}}
        onDragLeave={()=>setDrag(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
      >
        Drag image here, click to choose, or
        <button type="button" className="link" style={{ marginLeft: 6 }} onClick={(e)=>{e.stopPropagation(); onOpenCamera?.();}}>
          use camera
        </button>
      </div>

      <input ref={inputRef} type="file" accept={accept} hidden onChange={onChange} />
    </>
  );
}
