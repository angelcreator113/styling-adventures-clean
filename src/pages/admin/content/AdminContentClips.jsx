import React from "react";
import FilesBrowser from "@/components/files/FilesBrowser.jsx";

export default function AdminContentClips() {
  return <FilesBrowser scope="admin" fixedCategory={null} title="Admin Content — Clips" />;
}
