import mongoose from "mongoose";
import { UserModel } from "../src/models/User.js";

const MONGODB_URI = "mongodb+srv://ai_screener_user:7waBpvpqY49iui07@cluster0.xdxyaya.mongodb.net/?appName=Cluster0";

async function migrateRoles() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    console.log("\n=== Starting Role Migration ===\n");

    // Get all users without a role field
    const usersWithoutRole = await UserModel.find({ role: { $exists: false } });
    console.log(`Found ${usersWithoutRole.length} users without a role`);

    // Update all users to RECRUITER by default
    const updateResult = await UserModel.updateMany(
      { role: { $exists: false } },
      { $set: { role: "RECRUITER" } }
    );
    console.log(`Updated ${updateResult.modifiedCount} users to RECRUITER`);

    // Set SUPER_ADMIN for specific email
    const superAdminEmail = "abayohirwajovin@gmail.com";
    const superAdminResult = await UserModel.updateOne(
      { email: superAdminEmail },
      { $set: { role: "SUPER_ADMIN" } }
    );
    
    if (superAdminResult.modifiedCount > 0) {
      console.log(`\n✓ Set SUPER_ADMIN role for ${superAdminEmail}`);
    } else {
      console.log(`\n! User with email ${superAdminEmail} not found or already has SUPER_ADMIN role`);
    }

    // Verify the changes
    console.log("\n=== Verification ===");
    const recruiterCount = await UserModel.countDocuments({ role: "RECRUITER" });
    const superAdminCount = await UserModel.countDocuments({ role: "SUPER_ADMIN" });
    const noRoleCount = await UserModel.countDocuments({ role: { $exists: false } });

    console.log(`RECRUITER users: ${recruiterCount}`);
    console.log(`SUPER_ADMIN users: ${superAdminCount}`);
    console.log(`Users without role: ${noRoleCount}`);

    console.log("\n=== Migration Complete ===\n");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

migrateRoles();
