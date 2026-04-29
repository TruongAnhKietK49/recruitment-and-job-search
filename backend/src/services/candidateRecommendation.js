import Job from "../models/job.js";
import CandidateProfile from "../models/candidateProfile.js";
import Application from "../models/application.js";

function normalize(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim();
}

function compactNormalize(text = "") {
  return normalize(text).replace(/[^\p{L}\p{N}#+]+/gu, "");
}

function getSkillName(skill) {
  return skill?.skillName || skill?.name || skill?.toString?.() || "";
}

function toId(value) {
  return value?._id?.toString?.() || value?.toString?.() || "";
}

function uniq(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function tokenize(text = "") {
  const stopWords = new Set([
    "va",
    "hoac",
    "cho",
    "cac",
    "cua",
    "voi",
    "the",
    "mot",
    "nhung",
    "duoc",
    "trong",
    "ung",
    "vien",
    "cong",
    "viec",
    "kinh",
    "nghiem",
    "experience",
    "year",
    "years",
    "job",
    "work",
    "team",
  ]);

  return normalize(text)
    .replace(/[^\p{L}\p{N}#+.]+/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2 && !stopWords.has(word));
}

function hasMeaningfulOverlap(sourceText = "", targetText = "", minRatio = 0.6) {
  const sourceTokens = uniq(tokenize(sourceText));
  const targetTokens = new Set(tokenize(targetText));

  if (!sourceTokens.length || !targetTokens.size) return false;

  const matchedCount = sourceTokens.filter((token) => targetTokens.has(token)).length;
  return matchedCount / sourceTokens.length >= minRatio;
}

function calculateSkillScore(jobText, candidateSkills = []) {
  if (!jobText || candidateSkills.length === 0) {
    return {
      score: 0,
      matchedSkills: [],
    };
  }

  const normalizedJobText = normalize(jobText);
  const compactJobText = compactNormalize(jobText);
  const uniqueSkillNames = uniq(candidateSkills.map(getSkillName).map((skill) => skill.trim()).filter(Boolean));

  const matchedSkills = uniqueSkillNames.filter((skill) => {
    const normalizedSkill = normalize(skill);
    const compactSkill = compactNormalize(skill);

    return (
      normalizedJobText.includes(normalizedSkill) ||
      (compactSkill.length >= 2 && compactJobText.includes(compactSkill)) ||
      hasMeaningfulOverlap(skill, jobText)
    );
  });

  const score = matchedSkills.length
    ? Math.min(45, 18 + matchedSkills.length * 9 + Math.min(matchedSkills.length, 4) * 2)
    : 0;

  return {
    score,
    matchedSkills,
  };
}

function extractYears(text = "") {
  const normalizedText = normalize(text);

  if (!normalizedText) return null;
  if (/(khong yeu cau|khong can|fresher|intern|thuc tap|entry)/i.test(normalizedText)) return 0;

  const yearMatches = [...normalizedText.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:\+|nam|year|years|yr|yrs)/g)];
  if (!yearMatches.length) return null;

  return Math.max(...yearMatches.map((match) => Number(match[1].replace(",", "."))).filter((year) => !Number.isNaN(year)));
}

function calculateExperienceScore(jobExperience = "", profileText = "") {
  const requiredYears = extractYears(jobExperience);
  const candidateYears = extractYears(profileText);
  const hasProfileExperience = Boolean(normalize(profileText));

  if (requiredYears === 0) return hasProfileExperience ? 20 : 14;
  if (requiredYears === null) return hasProfileExperience ? 14 : 8;

  if (candidateYears !== null) {
    if (candidateYears >= requiredYears) return 20;
    if (candidateYears >= requiredYears - 1) return 16;
    if (candidateYears > 0) return 12;
  }

  if (hasMeaningfulOverlap(jobExperience, profileText, 0.4)) return 14;
  if (hasProfileExperience) return 9;

  return 4;
}

function calculateContextScore(job = {}, profileText = "") {
  const jobContext = `${job.title || ""} ${job.category || ""}`;
  const fullJobContext = `${jobContext} ${job.requirements || ""} ${job.description || ""}`;
  const normalizedProfileText = normalize(profileText);

  if (!normalizedProfileText) return 0;

  let score = 0;

  if (job.category && normalizedProfileText.includes(normalize(job.category))) {
    score += 7;
  }

  if (hasMeaningfulOverlap(job.title, profileText, 0.35)) {
    score += 5;
  }

  if (hasMeaningfulOverlap(fullJobContext, profileText, 0.18)) {
    score += 3;
  }

  return Math.min(score, 15);
}

function calculateLocationScore(job = {}, candidateAddress = "") {
  const jobLocation = normalize(job.location);
  const address = normalize(candidateAddress);

  if (normalize(job.jobType) === "remote" || jobLocation.includes("remote") || jobLocation.includes("tu xa")) {
    return 10;
  }

  if (!jobLocation || !address) return 4;
  if (jobLocation.includes(address) || address.includes(jobLocation)) return 10;
  if (hasMeaningfulOverlap(jobLocation, address, 0.35)) return 7;

  return 2;
}

function calculateSalaryScore(job = {}, expectedSalary) {
  const salary = Number(expectedSalary);
  const minSalary = Number(job.salaryMin) || 0;
  const maxSalary = Number(job.salaryMax) || 0;

  if (!salary || (!minSalary && !maxSalary)) return 5;
  if (maxSalary && salary <= maxSalary) return 10;
  if (minSalary && salary <= minSalary * 1.15) return 8;
  if (maxSalary && salary <= maxSalary * 1.2) return 6;

  return 2;
}

function buildReason(finalScore, level, matchedSkills = [], breakdown = {}) {
  const reasons = [];

  if (matchedSkills.length) {
    reasons.push(`khớp kỹ năng ${matchedSkills.slice(0, 4).join(", ")}`);
  }

  if (breakdown.experienceScore >= 14) {
    reasons.push("kinh nghiệm có tín hiệu phù hợp");
  }

  if (breakdown.contextScore >= 7) {
    reasons.push("profile liên quan đến vị trí/ngành tuyển dụng");
  }

  if (breakdown.locationScore >= 7) {
    reasons.push("khu vực làm việc tương đối phù hợp");
  }

  if (breakdown.salaryScore >= 8) {
    reasons.push("kỳ vọng lương nằm trong khoảng phù hợp");
  }

  return `Ứng viên đạt ${finalScore}/100 điểm (${level}). ${
    reasons.length ? `Điểm mạnh: ${reasons.join("; ")}.` : "Chưa có nhiều tín hiệu rõ ràng từ hồ sơ hiện tại."
  }`;
}

export async function recommendCandidatesForJob(jobId, limit = 10) {
  const job = await Job.findById(jobId);

  if (!job) {
    throw new Error("Không tìm thấy job");
  }

  const applications = await Application.find({ jobId });

  if (applications.length === 0) {
    return {
      job,
      candidates: [],
    };
  }

  const userIds = uniq(applications.map((app) => toId(app.userId)));
  const profileIds = uniq(applications.map((app) => toId(app.candidateProfileId)));

  const profiles = await CandidateProfile.find({
    $or: [{ _id: { $in: profileIds } }, { userId: { $in: userIds } }],
  }).populate("skills", "skillName");

  const profilesById = new Map(profiles.map((profile) => [toId(profile._id), profile]));
  const profilesByUserId = new Map(profiles.map((profile) => [toId(profile.userId), profile]));

  const jobText = `
    ${job.title || ""}
    ${job.category || ""}
    ${job.requirements || ""}
    ${job.description || ""}
    ${job.experience || ""}
    ${job.jobType || ""}
    ${job.location || ""}
  `;

  const candidates = applications
    .map((application) => {
      const profile =
        profilesById.get(toId(application.candidateProfileId)) || profilesByUserId.get(toId(application.userId));

      if (!profile) return null;

      const skillResult = calculateSkillScore(jobText, profile.skills || []);
      const profileText = `
        ${profile.expSummary || ""}
        ${profile.education || ""}
        ${(profile.skills || []).map(getSkillName).join(" ")}
      `;

      const experienceScore = calculateExperienceScore(job.experience, profileText);
      const contextScore = calculateContextScore(job, profileText);
      const locationScore = calculateLocationScore(job, profile.address);
      const salaryScore = calculateSalaryScore(job, profile.expectedSalary);

      const breakdown = {
        skillScore: skillResult.score,
        experienceScore,
        contextScore,
        locationScore,
        salaryScore,
      };

      const totalScore = Object.values(breakdown).reduce((total, score) => total + score, 0);
      const finalScore = Math.max(0, Math.min(totalScore, 100));

      let level = "Cần xem thêm";
      if (finalScore >= 80) level = "Rất tiềm năng";
      else if (finalScore >= 60) level = "Tiềm năng";
      else if (finalScore >= 40) level = "Có tín hiệu phù hợp";

      return {
        candidateId: profile._id,
        userId: profile.userId,
        applicationId: application?._id,
        applicationStatus: application?.status,
        score: finalScore,
        level,
        matchedSkills: skillResult.matchedSkills,
        breakdown,
        reason: buildReason(finalScore, level, skillResult.matchedSkills, breakdown),
        profile,
      };
    })
    .filter(Boolean);

  return {
    job,
    candidates: candidates.sort((a, b) => b.score - a.score).slice(0, Number(limit)),
  };
}
