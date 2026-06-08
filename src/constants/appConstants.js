export const C = {
  navy: "#0D1B2A", navyMid: "#1A2E45", navyLight: "#253D5B",
  teal: "#00BFA5", tealDark: "#009688", tealLight: "#E0F7F5",
  slate: "#4A5568", bg: "#F7F9FC", bgCard: "#FFFFFF",
  border: "#E2E8F0", text: "#1A202C", textMuted: "#718096", textLight: "#A0AEC0",
  danger: "#E53E3E", dangerBg: "#FFF5F5",
  success: "#38A169", successBg: "#F0FFF4",
  warning: "#D69E2E", warningBg: "#FFFBEB",
  purple: "#7C3AED", purpleBg: "#F5F3FF",
  indigo: "#4F46E5", indigoBg: "#EEF2FF",
};

export const EMPTY_USER = {
  id: null, name: "", email: "", phone: "", location: "", summary: "",
  desiredTitles: [], industries: [], availability: "immediately",
  subscription: "free", idVerified: false, employmentStatus: "open",
  salaryTarget: "", salaryLevel: "senior", backgroundCheck: false,
  wotcEligible: false, sponsorshipRequired: false,
  employmentTypes: ["full-time"], workLocations: ["remote"],
};

// Still used by HistoryPage and ResumesPage (will be replaced when those pages get real DB reads)
export const SEED_RESUMES = [
  { id:"1", name:"My Resume", template:"modern", primary:true, updated:"–", matchScore:null },
];
export const SEED_ANALYSES = [];

// ── Salary ranges by level ────────────────────────────────────────────────
export const SALARY_MAP = {
  "entry":    { label:"Entry Level",    range:"$45,000 – $70,000" },
  "mid":      { label:"Mid-Level",      range:"$70,000 – $105,000" },
  "senior":   { label:"Senior",         range:"$110,000 – $155,000" },
  "manager":  { label:"Manager",        range:"$120,000 – $165,000" },
  "director": { label:"Director",       range:"$150,000 – $210,000" },
  "experienced":{ label:"Experienced",  range:"$95,000 – $135,000" },
  "custom":   { label:"Custom Target",  range:"" },
};


export const NAV = [
  { id:"dashboard",    label:"Dashboard",     icon:"⊞" },
  { id:"profile",      label:"My Profile",    icon:"👤" },
  { id:"resumes",      label:"Resumes",       icon:"📄" },
  { id:"builder",      label:"Resume Builder",icon:"✏️" },
  { id:"ai-optimize",  label:"AI Optimizer",  icon:"✦" },
  { id:"cover-letter", label:"Cover Letter",  icon:"✉️" },
  { id:"settings",     label:"Settings",      icon:"⚙️" },
];

export const DEFAULT_SECTIONS = [
  { section_type:"name",           label:"Name & Contact",      icon:"👤", is_required:true,  is_visible:true, display_order:0, content:{} },
  { section_type:"summary",        label:"Professional Summary", icon:"📝", is_required:false, is_visible:true, display_order:1, content:{text:""} },
  { section_type:"skills",         label:"Skills",              icon:"⚡", is_required:false, is_visible:true, display_order:2, content:{text:""} },
  { section_type:"experience",     label:"Work Experience",     icon:"💼", is_required:false, is_visible:true, display_order:3, content:{text:""} },
  { section_type:"education",      label:"Education",           icon:"🎓", is_required:false, is_visible:true, display_order:4, content:{text:""} },
  { section_type:"certifications", label:"Certifications",      icon:"🏅", is_required:false, is_visible:true, display_order:5, content:{text:""} },
  { section_type:"projects",       label:"Projects",            icon:"🚀", is_required:false, is_visible:false, display_order:6, content:{text:""} },
  { section_type:"awards",         label:"Awards",              icon:"🏆", is_required:false, is_visible:false, display_order:7, content:{text:""} },
  { section_type:"volunteer",      label:"Volunteer",           icon:"🤝", is_required:false, is_visible:false, display_order:8, content:{text:""} },
];


export const FONT_PRESETS = [
  { label:"DM Sans",      value:"DM Sans, sans-serif",        category:"Modern" },
  { label:"Georgia",      value:"Georgia, serif",              category:"Classic" },
  { label:"Garamond",     value:"Garamond, serif",             category:"Classic" },
  { label:"Helvetica",    value:"Helvetica, Arial, sans-serif",category:"Clean" },
  { label:"Lato",         value:"Lato, sans-serif",            category:"Modern" },
  { label:"Merriweather", value:"Merriweather, serif",         category:"Classic" },
  { label:"Montserrat",   value:"Montserrat, sans-serif",      category:"Bold" },
  { label:"Nunito",       value:"Nunito, sans-serif",          category:"Friendly" },
  { label:"Open Sans",    value:"Open Sans, sans-serif",       category:"Clean" },
  { label:"Playfair",     value:"Playfair Display, serif",     category:"Elegant" },
  { label:"Raleway",      value:"Raleway, sans-serif",         category:"Modern" },
  { label:"Courier New",  value:"Courier New, monospace",      category:"Technical" },
];

export const HEADER_LAYOUTS = [
  { id:"left",        label:"Left Aligned",  icon:"⬅", tier:"free" },
  { id:"centered",    label:"Centered",      icon:"↔", tier:"free" },
  { id:"bold_banner", label:"Bold Banner",   icon:"█", tier:"premium" },
  { id:"sidebar",     label:"Sidebar",       icon:"▊", tier:"premium" },
];

export const STRIPE_PRICES = {
  premium:        import.meta.env.VITE_STRIPE_PRICE_PREMIUM        || "price_1TeQPBJxspsNVfjVzD3WsCCd",
  premium_plus:   import.meta.env.VITE_STRIPE_PRICE_PREMIUM_PLUS   || "price_1TeQPNJxspsNVfjVdvwY3eOR",
  recruiter_look: import.meta.env.VITE_STRIPE_PRICE_RECRUITER_LOOK || "price_1TeQPqJxspsNVfjVLm6QbpoM",
};

