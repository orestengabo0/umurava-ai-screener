import type { Request, Response } from "express";
import { JobModel } from "../models/Job.ts";
import { Applicant } from "../models/Applicant.ts";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalJobs = await JobModel.countDocuments();
    const openJobs = await JobModel.countDocuments({ status: "open" });
    const totalApplicants = await Applicant.countDocuments();
    
    // Recent activity: last 5 applicants
    const recentApplicants = await Applicant.find()
      .sort({ uploadedAt: -1 })
      .limit(5)
      .lean();

    // Stats for a chart (last 7 days of applicants?)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activityData = await Applicant.aggregate([
      { $match: { uploadedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$uploadedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      totalJobs,
      openJobs,
      totalApplicants,
      recentApplicants,
      activityData
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};
