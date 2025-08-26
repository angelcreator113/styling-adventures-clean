import React from "react";
import Icon from "@/components/Icon";

export default function TopbarSearch({ q, pending, inputRef, onChange, onSubmit }) {
  return (
    <form
      className={`searchbar ${pending ? "is-pending" : ""}`}
      onSubmit={onSubmit}
      role="search"
      aria-label="Site search"
    >
      <span className="search-ico"><Icon name="search" /></span>
      <input
        ref={inputRef}
        type="search"
        placeholder="Search closet, voice, episodes…"
        value={q}
        onChange={(e) => onChange(e.target.value)}
      />
      {!!q && (
        <button
          type="button"
          className="clear-btn"
          aria-label="Clear search"
          onClick={() => { onChange(""); inputRef.current?.focus(); }}
        >
          ×
        </button>
      )}
      {pending && <span className="spinner" aria-hidden="true" />}
    </form>
  );
}
