import React, { useRef, useState, useEffect } from "react";
import Icon from "@/components/Icon";

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  return (
    <div className="menu-anchor" ref={ref}>
      <button className="icon-btn" aria-label="Notifications" title="Notifications" onClick={() => setOpen(v => !v)}>
        <Icon name="bell" />
      </button>
      {open && (
        <div className="menu" role="menu" style={{ minWidth: 280 }}>
          <div className="menu-item" role="menuitem" tabIndex={-1} style={{ opacity: .8 }}>
            No new notifications.
          </div>
        </div>
      )}
    </div>
  );
}
