import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Job } from "../models/jobs.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const retentionMs = 60 * 24 * 60 * 60 * 1000;

const main = async () => {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is required.");
  }

  await mongoose.connect(process.env.MONGODB_URL);
  const now = new Date();
  const deleteAfter = new Date(now.getTime() + retentionMs);

  const backfillResult = await Job.collection.updateMany(
    {},
    [
      {
        $set: {
          is_active: { $ifNull: ["$is_active", true] },
          first_seen_at: {
            $ifNull: [
              "$first_seen_at",
              { $ifNull: ["$createdAt", { $ifNull: ["$scraped_at", "$postedAt"] }] },
            ],
          },
          last_seen_at: {
            $ifNull: [
              "$last_seen_at",
              { $ifNull: ["$scraped_at", { $ifNull: ["$updatedAt", "$createdAt"] }] },
            ],
          },
          new_until: { $ifNull: ["$new_until", null] },
        },
      },
    ]
  );

  const expiredResult = await Job.updateMany(
    {
      $or: [
        { expires_at: { $lte: now } },
        { application_deadline: { $lte: now } },
      ],
    },
    {
      $set: {
        is_active: false,
        project_status: "expired",
        expired_at: now,
        delete_after: deleteAfter,
      },
    }
  );

  console.log(
    `Lifecycle backfill complete. Matched ${backfillResult.matchedCount}, ` +
    `modified ${backfillResult.modifiedCount}, expired ${expiredResult.modifiedCount}.`
  );
};

main()
  .catch((error) => {
    console.error("Lifecycle backfill failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
