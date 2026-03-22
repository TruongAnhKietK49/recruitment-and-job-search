import JobViewHistory from "../models/jobViewHistory.js";

// Add job view history
export const addJobViewHistory = async (req, res) => {
  try {
    const { jobId } = req.body;

    const existingView = await JobViewHistory.findOne({
      userId: req.user.userId,
      jobId,
    });

    if (existingView) {
      existingView.viewDate = new Date();
      await existingView.save();

      return res.status(200).json(existingView);
    }

    const newView = new JobViewHistory({
      userId: req.user.userId,
      jobId,
      viewDate: new Date(),
    });

    const savedView = await newView.save();

    res.status(201).json(savedView);
  } catch (error) {
    res.status(500).json({
      message: "Error saving job view history",
      error: error.message,
    });
  }
};

// Get my view history
export const getMyJobViewHistory = async (req, res) => {
  try {
    const histories = await JobViewHistory.find({
      userId: req.user.userId,
    })
      .populate({
        path: "jobId",
        populate: {
          path: "companyId",
          select: "companyName logoUrl",
        },
      })
      .sort({ viewDate: -1 });

    res.status(200).json(histories);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching job view history",
      error: error.message,
    });
  }
};

// Delete one history item
export const deleteJobViewHistory = async (req, res) => {
  try {
    const history = await JobViewHistory.findById(req.params.id);

    if (!history) {
      return res.status(404).json({ message: "History not found" });
    }

    if (history.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await JobViewHistory.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "History deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting history",
      error: error.message,
    });
  }
};
