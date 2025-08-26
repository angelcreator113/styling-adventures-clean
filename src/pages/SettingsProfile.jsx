import React from "react";
import FanModeToggle from "@/components/FanModeToggle.jsx";

export default function SettingsProfile(){
  return (
    <section className="container">
      <h1 className="page-title">Profile Settings</h1>
      <FanModeToggle />
    </section>
  );
}
