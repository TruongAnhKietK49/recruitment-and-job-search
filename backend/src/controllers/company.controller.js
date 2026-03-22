import Company from "../models/company.js";
import Job from "../models/job.js";

// Create a new company
export const createCompany = async (req, res) => {
  try {
    const { companyName, address, website, description, logoUrl } = req.body;

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
      website,
      description,
      logoUrl,
      createdBy: req.user.userId,
      members: [req.user.userId],
    });

    const savedCompany = await newCompany.save();

    const populatedCompany = await Company.findById(savedCompany._id).populate(
      "createdBy",
      "fullName email role",
    );

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

// Get a company by ID
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate(
      "createdBy",
      "fullName email role",
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (
      req.user.role === "hr" &&
      company.createdBy._id.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const jobs = await Job.find({ companyId: company._id })
      .select(
        "title category salaryMin salaryMax experience jobType deadline status createdAt",
      )
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
