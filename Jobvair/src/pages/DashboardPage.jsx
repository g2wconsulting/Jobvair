import {
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  GraduationCap,
  Layers3,
  Lightbulb,
  MessageSquareText,
  PenLine,
  Rocket,
  SearchCheck,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  WandSparkles,
} from "lucide-react";
import { Badge, Button, Card, Page, ResponsiveGrid, Section } from "../components/ui/index.js";
import "./DashboardPage.css";

export default function DashboardPage({ user, onNav }) {
  const readiness = {
    overall: 86,
    resume: 88,
    ats: 81,
    interview: 73,
  };

  const recommendations = [
    {
      title: "Improve Resume Summary",
      detail: "Make the first three lines more specific to your target role and leadership impact.",
      priority: "High",
      impact: "+9 quality points",
      icon: PenLine,
    },
    {
      title: "Add measurable accomplishments",
      detail: "Six bullets describe responsibilities but do not show scale, savings, revenue, or speed.",
      priority: "High",
      impact: "+12 ATS points",
      icon: TrendingUp,
    },
    {
      title: "Tailor resume for Project Manager",
      detail: "Create a version that emphasizes delivery, stakeholder management, and roadmap ownership.",
      priority: "Medium",
      impact: "+18 match lift",
      icon: Target,
    },
    {
      title: "Missing AWS keyword",
      detail: "AWS appears in your profile, but the latest resume version does not reinforce it.",
      priority: "Medium",
      impact: "+6 keyword coverage",
      icon: SearchCheck,
    },
  ];

  const continueWorking = [
    { title: "Resume Builder", detail: "Update your targeted resume version", icon: FileText, nav: "builder", action: "Continue" },
    { title: "Cover Letter", detail: "Draft a tailored cover letter", icon: Send, nav: "cover-letter", action: "Create" },
    { title: "AI Optimizer", detail: "Analyze a resume against a job target", icon: WandSparkles, nav: "ai-optimize", action: "Optimize" },
  ];

  const resumeVersions = [
    { name: "Project Manager - Healthcare", modified: "Today", template: "Modern", score: 88 },
    { name: "Technical Program Manager", modified: "Yesterday", template: "Executive", score: 82 },
    { name: "Operations Leader", modified: "Jun 28", template: "Classic", score: 76 },
  ];

  const jobTargets = [
    { title: "Project Manager", company: "Northstar Health", match: 92, salary: "$118k - $145k" },
    { title: "Technical Program Manager", company: "CareBridge Systems", match: 87, salary: "$132k - $164k" },
    { title: "Implementation Manager", company: "BrightPath Tech", match: 81, salary: "$105k - $132k" },
  ];

  const tracker = [
    { label: "Applications", value: 12, icon: ClipboardList },
    { label: "Interviews", value: 4, icon: CalendarCheck2 },
    { label: "Offers", value: 1, icon: Trophy },
  ];

  const trackerTimeline = [
    { stage: "Applied", company: "Northstar Health", detail: "Project Manager resume sent", status: "complete" },
    { stage: "Interview", company: "CareBridge Systems", detail: "Prep questions recommended", status: "active" },
    { stage: "Offer", company: "BrightPath Tech", detail: "Comp range review pending", status: "upcoming" },
  ];

  const activity = [
    { title: "Resume version updated", detail: "Project Manager - Healthcare", time: "12 min ago", icon: FileText },
    { title: "AI recommendation generated", detail: "Add measurable accomplishments", time: "Today", icon: Sparkles },
    { title: "Job target refreshed", detail: "3 new matching roles found", time: "Today", icon: BriefcaseBusiness },
    { title: "Profile signal improved", detail: "Skills evidence updated", time: "Yesterday", icon: Layers3 },
  ];

  const learning = [
    { label: "Recommended certification", value: "PMP Certification", icon: Award },
    { label: "Recommended skill", value: "Stakeholder Communication", icon: BookOpenCheck },
    { label: "Suggested next step", value: "Practice STAR interview stories", icon: GraduationCap },
  ];

  return (
    <Page size="wide" className="jobvair-page dashboard-command-center">
      <section className="command-hero">
        <div className="command-hero__content">
          <Badge tone="info" icon={Sparkles}>AI Career Command Center</Badge>
          <h1>Good morning, {user.name}</h1>
          <p>
            Your career workspace is ready. Continue building a sharper resume, stronger job targets, and a more confident interview story.
          </p>
          <div className="command-hero__actions">
            <Button icon={FileText} onClick={() => onNav("builder")}>Continue Resume</Button>
            <Button variant="secondary" icon={WandSparkles} onClick={() => onNav("ai-optimize")}>Optimize Resume</Button>
          </div>
        </div>

        <Card className="career-readiness-hero-card">
          <div className="readiness-ring" style={{ "--score": `${readiness.overall}%` }}>
            <div>
              <span>{readiness.overall}</span>
              <small>Career Readiness</small>
            </div>
          </div>
          <div className="hero-score-meta">
            <strong>Premium profile momentum</strong>
            <span>Strong foundation. Focus next on quantified achievements and interview stories.</span>
          </div>
        </Card>
      </section>

      <Card className="career-readiness-card">
        <Section
          title="Career Readiness"
          description="A mock AI snapshot of how prepared your profile is for your target roles."
          actions={<Badge tone="success" icon={CheckCircle2}>On track</Badge>}
        >
          <div className="readiness-panel">
            <div className="readiness-panel__primary">
              <div className="readiness-ring readiness-ring--large" style={{ "--score": `${readiness.overall}%` }}>
                <div>
                  <span>{readiness.overall}</span>
                  <small>Overall</small>
                </div>
              </div>
              <p>Your resume, ATS compatibility, and interview readiness are trending upward.</p>
            </div>

            <div className="readiness-breakdown">
              {[
                { label: "Resume Quality", value: readiness.resume, icon: FileText },
                { label: "ATS Compatibility", value: readiness.ats, icon: Gauge },
                { label: "Interview Readiness", value: readiness.interview, icon: MessageSquareText },
              ].map((metric) => {
                const Icon = metric.icon;

                return (
                  <div className="readiness-row" key={metric.label}>
                    <div className="readiness-row__label">
                      <span><Icon size={17} aria-hidden="true" /></span>
                      <strong>{metric.label}</strong>
                    </div>
                    <div className="readiness-row__bar" aria-hidden="true">
                      <span style={{ width: `${metric.value}%` }} />
                    </div>
                    <em>{metric.value}%</em>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      </Card>

      <div className="dashboard-two-column">
        <main className="dashboard-main">
          <Card>
            <Section
              title="AI Recommendations"
              description="Highest-value moves Jobvair would prioritize next."
              actions={<Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => onNav("ai-optimize")}>See optimizer</Button>}
            >
              <div className="recommendation-grid">
                {recommendations.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article className="recommendation-card" key={item.title}>
                      <div className="recommendation-card__top">
                        <span><Icon size={20} aria-hidden="true" /></span>
                        <Badge tone={item.priority === "High" ? "warning" : "info"}>{item.priority}</Badge>
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.detail}</p>
                      <div className="recommendation-card__footer">
                        <strong>{item.impact}</strong>
                        <Button size="sm" variant="secondary" onClick={() => onNav("ai-optimize")}>Act</Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Section>
          </Card>

          <Section title="Continue Working" description="Fast paths back into the core Jobvair workflow.">
            <ResponsiveGrid min="240px" gap="18px">
              {continueWorking.map((item) => {
                const Icon = item.icon;

                return (
                  <Card key={item.title} interactive className="continue-work-card" onClick={() => onNav(item.nav)}>
                    <span><Icon size={24} aria-hidden="true" /></span>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                    <em>{item.action}<ArrowRight size={14} aria-hidden="true" /></em>
                  </Card>
                );
              })}
            </ResponsiveGrid>
          </Section>

          <ResponsiveGrid min="330px" gap="18px">
            <Card>
              <Section
                title="Resume Versions"
                actions={<Button variant="ghost" size="sm" onClick={() => onNav("resumes")}>Manage</Button>}
              >
                <div className="resume-version-list">
                  {resumeVersions.map((resume) => (
                    <div className="resume-version-row" key={resume.name}>
                      <div>
                        <strong>{resume.name}</strong>
                        <small>Modified {resume.modified} · {resume.template} template</small>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => onNav("builder")}>Open</Button>
                    </div>
                  ))}
                </div>
              </Section>
            </Card>

            <Card>
              <Section
                title="Job Targets"
                actions={<Button variant="ghost" size="sm" onClick={() => onNav("ai-optimize")}>Edit</Button>}
              >
                <div className="job-target-list">
                  {jobTargets.map((job) => (
                    <div className="job-target-row" key={`${job.company}-${job.title}`}>
                      <div>
                        <strong>{job.title}</strong>
                        <small>{job.company} · {job.salary}</small>
                      </div>
                      <span>{job.match}%</span>
                    </div>
                  ))}
                </div>
              </Section>
            </Card>
          </ResponsiveGrid>

          <Card>
            <Section
              title="Application Tracker"
              description="Mock pipeline snapshot for applications, interviews, and offers."
              actions={<Badge tone="neutral">Preview data</Badge>}
            >
              <div className="tracker-summary">
                {tracker.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div className="tracker-stat" key={item.label}>
                      <span><Icon size={19} aria-hidden="true" /></span>
                      <strong>{item.value}</strong>
                      <small>{item.label}</small>
                    </div>
                  );
                })}
              </div>

              <div className="pipeline-timeline">
                {trackerTimeline.map((item) => (
                  <div className={`pipeline-step pipeline-step--${item.status}`} key={`${item.stage}-${item.company}`}>
                    <span />
                    <div>
                      <strong>{item.stage}</strong>
                      <small>{item.company}</small>
                      <p>{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </Card>
        </main>

        <aside className="dashboard-side">
          <Card className="learning-card">
            <Section title="Learning Section" description="Recommended next growth areas.">
              <div className="learning-list">
                {learning.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div className="learning-item" key={item.label}>
                      <span><Icon size={18} aria-hidden="true" /></span>
                      <div>
                        <small>{item.label}</small>
                        <strong>{item.value}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          </Card>

          <Card>
            <Section title="Activity Feed">
              <div className="activity-feed">
                {activity.map((event) => {
                  const Icon = event.icon;

                  return (
                    <div className="activity-item" key={`${event.title}-${event.time}`}>
                      <span><Icon size={16} aria-hidden="true" /></span>
                      <div>
                        <strong>{event.title}</strong>
                        <p>{event.detail}</p>
                        <small>{event.time}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          </Card>

          <Card className="next-step-card">
            <Lightbulb size={24} aria-hidden="true" />
            <h2>Suggested next step</h2>
            <p>Open the Resume Builder and strengthen your summary before optimizing against the next job target.</p>
            <Button full icon={Rocket} onClick={() => onNav("builder")}>Continue Resume</Button>
          </Card>
        </aside>
      </div>
    </Page>
  );
}
