import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "clean up abandoned uploads",
  { hourUTC: 4, minuteUTC: 0 },
  internal.photos.cleanupOrphans,
);

export default crons;
