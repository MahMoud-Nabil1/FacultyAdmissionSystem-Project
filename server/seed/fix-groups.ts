import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { Group } from "../models/group";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function fixGroups() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Find groups where place is NOT a valid ObjectId (old string data)
        const result = await Group.deleteMany({
            place: { $type: "string" }
        });

        console.log(`Deleted ${result.deletedCount} groups with invalid place data`);
        console.log("Done! Now recreate groups with valid Place references.");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

fixGroups();
