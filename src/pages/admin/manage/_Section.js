// src/pages/admin/manage/_Section.js (optional helper)
import React from "react";
export default function Section({ title, children }){
  return (
    <section className="container" style={{padding:16}}>
      <div className="dashboard-card">
        <h1 style={{marginTop:0}}>{title}</h1>
        {children || <p>Coming soon.</p>}
      </div>
    </section>
  );
}
