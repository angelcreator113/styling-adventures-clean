// centralize your collection ref for planner events
import { collection } from "firebase/firestore";
import { db } from "@/utils/init-firebase";

export const plannerEventsCol = (uid) =>
  collection(db, `users/${uid}/planner_events`);
