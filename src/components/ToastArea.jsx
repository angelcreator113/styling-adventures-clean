import React, { useEffect, useState } from 'react';

const ToastArea = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    window.showToast = (msg) => {
      setToasts((prev) => [...prev, msg]);
      setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 3500);
    };
  }, []);

  return (
    <div className="toast-area fixed top-0 right-0 p-4 space-y-2 z-50">
      {toasts.map((msg, i) => (
        <div key={i} className="toast bg-purple-100 text-purple-900 px-4 py-2 rounded shadow">
          {msg}
        </div>
      ))}
    </div>
  );
};

export default ToastArea;
