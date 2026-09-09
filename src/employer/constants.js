export const EMPLOYER_NAV = [
  { id: "dashboard",    label: "Dashboard" },
  { id: "jobs",         label: "Jobs" },
  { id: "candidates",   label: "Candidates" },
  { id: "assessments",  label: "Assessments" },
  { id: "assessment-builder", label: "Assessment Builder" },
  { id: "hiring",       label: "Hiring" },
  { id: "intelligence", label: "Intelligence" },
  { id: "company",      label: "Company" },
  { id: "billing",      label: "Billing" },
  { id: "settings",     label: "Settings" },
];

export const JOB_STATUSES = ["draft", "published", "paused", "closed", "archived"];

export const PIPELINE_STAGES = [
  { id: "applied",         label: "Applied" },
  { id: "screening",       label: "Screening" },
  { id: "qualified",       label: "Qualified" },
  { id: "interview",       label: "Interview" },
  { id: "final_interview", label: "Final Interview" },
  { id: "offer",           label: "Offer" },
  { id: "hired",           label: "Hired" },
];

export const PIPELINE_SIDE_STAGES = [
  { id: "rejected",  label: "Rejected" },
  { id: "withdrawn", label: "Withdrawn" },
  { id: "on_hold",   label: "On Hold" },
];

export const ALL_STAGES = [...PIPELINE_STAGES, ...PIPELINE_SIDE_STAGES];

export const EMPLOYER_ROLES = [
  { value: "company_admin",  label: "Company Admin" },
  { value: "recruiter",      label: "Recruiter" },
  { value: "hiring_manager", label: "Hiring Manager" },
];

export const EMPTY_COMPANY = {
  name: "", website: "", industry: "", company_size: "", employee_count: "",
  headquarters_location: "", hiring_locations: [], annual_hiring_volume: "",
  logo_url: "", description: "", culture: "", work_environment: "",
  benefits: [], social_links: {},
};

export const EMPTY_JOB = {
  title: "", department: "", location: "", work_arrangement: "onsite",
  employment_type: "full-time", salary_min: "", salary_max: "",
  min_qualifications: "", preferred_qualifications: "",
  experience_requirements: "", education_requirements: "",
  required_skills: [], preferred_skills: [], description: "",
  responsibilities: "", benefits: "", travel_requirements: "",
  screening_questions: [], status: "draft",
};
