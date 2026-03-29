import Company from "../models/company.js";
import Job from "../models/job.js";
import joinRequest from "../models/joinRequest.js";

// Create a new company
export const createCompany = async (req, res) => {
  try {
    const { companyName, address, category, website, description, phoneCompany, logoUrl } = req.body;
    const existingCompany = await Company.findOne({
      companyName: { $regex: `^${companyName}$`, $options: "i" },
      createdBy: req.user.userId,
    });

    if (existingCompany) {
      return res.status(400).json({
        message: "You have already created a company with this name",
      });
    }

    const newCompany = new Company({
      companyName,
      address,
      category,
      website,
      description,
      phoneCompany,
      logoUrl,
      createdBy: req.user.userId,
      members: [
        {
          user: req.user.userId,
          role: "owner",
        },
      ],
    });

    const savedCompany = await newCompany.save();

    const populatedCompany = await Company.findById(savedCompany._id).populate("createdBy", "fullName email role");

    res.status(201).json(populatedCompany);
  } catch (error) {
    res.status(500).json({
      message: "Error creating company",
      error: error.message,
    });
  }
};

// Get all companies
export const getAllCompanies = async (req, res) => {
  try {
    const pageNumber = Number.parseInt(req.query.page, 10) || 1;
    const limitNumber = Number.parseInt(req.query.limit, 10) || 10;
    const { keyword, status } = req.query;

    const query = {};

    if (keyword) {
      query.companyName = { $regex: keyword, $options: "i" };
    }

    if (status) {
      query.status = status;
    }

    if (req.user.role === "hr") {
      query.createdBy = req.user.userId;
    }

    const companies = await Company.find(query)
      .populate("createdBy", "fullName email role")
      .populate("members", "fullName email role status")
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

    const total = await Company.countDocuments(query);

    res.status(200).json({
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      companies,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching companies",
      error: error.message,
    });
  }
};

// Get my company
export const getMyCompany = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.userId || req.user._id;

    const company = await Company.findOne({
      "members.user": userId,
    })
      .populate("createdBy", "fullName email role")
      .populate("members.user", "fullName email role status");

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json(company);
  } catch (error) {
    console.error("getMyCompany error:", error);
    res.status(500).json({
      message: "Error fetching company",
      error: error.message,
    });
  }
};

// Get a company by ID
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate("createdBy", "fullName email role");

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (req.user.role === "hr" && company.createdBy._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const jobs = await Job.find({ companyId: company._id })
      .select("title category salaryMin salaryMax experience jobType deadline status createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      company,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching company",
      error: error.message,
    });
  }
};

// Update company info (ONLY OWNER)
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user._id;

    const { companyName, address, category, website, description, phoneCompany, logoUrl, status } = req.body;

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    // Check user có trong company không
    const member = company.members.find((m) => m.user.toString() === userId.toString());

    if (!member) {
      return res.status(403).json({
        message: "You are not a member of this company",
      });
    }

    // Check role owner
    if (member.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can update company information",
      });
    }

    // Update fields
    if (companyName !== undefined) company.companyName = companyName;
    if (address !== undefined) company.address = address;
    if (category !== undefined) company.category = category;
    if (website !== undefined) company.website = website;
    if (description !== undefined) company.description = description;
    if (phoneCompany !== undefined) company.phoneCompany = phoneCompany;
    if (logoUrl !== undefined) company.logoUrl = logoUrl;
    if (status !== undefined) company.status = status;

    await company.save();

    const updatedCompany = await Company.findById(id)
      .populate("createdBy", "fullName email role")
      .populate("members.user", "fullName email role status");

    res.status(200).json({
      message: "Company updated successfully",
      company: updatedCompany,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating company",
      error: error.message,
    });
  }
};

// Delete a company by ID
export const deleteCompany = async (req, res) => {
  try {
    const deletedCompany = await Company.findByIdAndDelete(req.params.id);
    console.log(deletedCompany);
    if (!deletedCompany) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({ message: "Company deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting company",
      error: error.message,
    });
  }
};

export const createJoinRequest = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { requestedRole } = req.body;

    const userId = req.user.userId || req.user._id;
    const roleToRequest = requestedRole || "member";

    if (!["member", "admin"].includes(roleToRequest)) {
      return res.status(400).json({
        message: "Invalid requested role",
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    const alreadyInACompany = await Company.findOne({
      "members.user": userId,
    });

    if (alreadyInACompany) {
      return res.status(400).json({
        message: "You are already a member of a company",
      });
    }

    const existingPendingRequest = await JoinRequest.findOne({
      company: companyId,
      user: userId,
      status: "pending",
    });

    if (existingPendingRequest) {
      return res.status(400).json({
        message: "You already have a pending join request for this company",
      });
    }

    const request = await JoinRequest.create({
      company: companyId,
      user: userId,
      requestedRole: roleToRequest,
      status: "pending",
    });

    res.status(201).json({
      message: "Join request created successfully",
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating join request",
      error: error.message,
    });
  }
};

export const getMyCompanyJoinRequests = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    const company = await Company.findOne({
      "members.user": userId,
    });

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    const currentMember = company.members.find((member) => member.user.toString() === userId.toString());

    if (!currentMember || !["owner", "admin"].includes(currentMember.role)) {
      return res.status(403).json({
        message: "Only owner or admin can view join requests",
      });
    }

    const requests = await joinRequest.find({
      company: company._id,
      status: "pending",
    })
      .populate("user", "fullName email role status")
      .populate("company", "companyName")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching join requests",
      error: error.message,
    });
  }
};

export const approveJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId || req.user._id;

    const request = await joinRequest.findById(requestId)
      .populate("user", "fullName email role status")
      .populate("company");

    if (!request || request.status !== "pending") {
      return res.status(404).json({
        message: "Pending join request not found",
      });
    }

    const company = await Company.findById(request.company._id);
    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    const approver = company.members.find((member) => member.user.toString() === userId.toString());

    if (!approver) {
      return res.status(403).json({
        message: "You are not a member of this company",
      });
    }

    if (request.requestedRole === "admin" && approver.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can approve admin requests",
      });
    }

    if (request.requestedRole === "member" && !["owner", "admin"].includes(approver.role)) {
      return res.status(403).json({
        message: "Permission denied",
      });
    }

    const alreadyMember = company.members.some((member) => member.user.toString() === request.user._id.toString());

    if (alreadyMember) {
      return res.status(400).json({
        message: "User is already a member of this company",
      });
    }

    company.members.push({
      user: request.user._id,
      role: request.requestedRole,
    });

    await company.save();

    request.status = "approved";
    request.reviewedBy = userId;
    request.reviewedAt = new Date();
    await request.save();

    res.status(200).json({
      message: "Join request approved successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error approving join request",
      error: error.message,
    });
  }
};

export const rejectJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId || req.user._id;

    const request = await joinRequest.findById(requestId).populate("company");

    if (!request || request.status !== "pending") {
      return res.status(404).json({
        message: "Pending join request not found",
      });
    }

    const company = await Company.findById(request.company._id);
    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    const reviewer = company.members.find((member) => member.user.toString() === userId.toString());

    if (!reviewer) {
      return res.status(403).json({
        message: "You are not a member of this company",
      });
    }

    if (request.requestedRole === "admin" && reviewer.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can reject admin requests",
      });
    }

    if (request.requestedRole === "member" && !["owner", "admin"].includes(reviewer.role)) {
      return res.status(403).json({
        message: "Permission denied",
      });
    }

    request.status = "rejected";
    request.reviewedBy = userId;
    request.reviewedAt = new Date();
    await request.save();

    res.status(200).json({
      message: "Join request rejected successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error rejecting join request",
      error: error.message,
    });
  }
};
