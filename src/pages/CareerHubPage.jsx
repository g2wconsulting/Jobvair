import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  DollarSign,
  FileText,
  Gauge,
  Linkedin,
  MapPin,
  MessageSquareText,
  MonitorSmartphone,
  PenLine,
  SearchCheck,
  Sparkles,
  Target,
  Trophy,
  WandSparkles,
} from "lucide-react";
import { Badge, Button, Card, Page, ResponsiveGrid, Section } from "../components/ui/index.js";
import "./CareerHubPage.css";

const readiness = [
  { label: "Resume", value: 84, icon: FileText },
  { label: "ATS", value: 78, icon: Gauge },
  { label: "Interview", value: 66, icon: MessageSquareText },
  { label: "LinkedIn", value: 58, icon: Linkedin },
  { label: "Skills", value: 81, icon: BadgeCheck },
];

const priorities = [
  { title: "Rewrite summary", impact: "Clarify your target role in the first 3 lines.", done: true },
  { title: "Add measurable accomplishments", impact: "Add numbers to 4 project bullets.", done: true },
  { title: "Complete LinkedIn", impact: "Mirror your resume headline and target skills.", done: false },
  { title: "Practice interview", impact: "Prepare 3 STAR stories for leadership questions.", done: false },
];

const goals = [
  { label: "Target Role", value: "Product Manager", icon: Target },
  { label: "Desired Salary", value: "$125k - $150k", icon: DollarSign },
  { label: "Preferred Location", value: "Remote / Hybrid", icon: MapPin },
  { label: "Work Style", value: "Cross-functional teams", icon: MonitorSmartphone },
];

const skills = {
  current: ["Product strategy", "Agile delivery", "Healthcare workflows", "Stakeholder management", "SQL"],
  missing: ["Roadmap analytics", "A/B testing", "Product-led growth", "Pricing strategy"],
  certifications: ["Product Management Certificate", "Pragmatic Institute", "Google Data Analytics"],
};

const progress = [
  { label: "Resume Progress", value: 72, detail: "Summary and accomplishments need focus.", icon: FileText },
  { label: "Interview Progress", value: 46, detail: "Practice examples for conflict and metrics.", icon: MessageSquareText },
  { label: "Job Search Progress", value: 61, detail: "3 targets are strong, 2 need better tailoring.", icon: SearchCheck },
];

const applications = [
  { role: "Associate Product Manager", company: "BrightPath Health", stage: "Applied", status: "In review" },
  { role: "Product Manager", company: "Northstar Systems", stage: "Interview", status: "Prep needed" },
  { role: "Implementation Product Lead", company: "CareBridge", stage: "Saved", status: "Tailor resume" },
];

const coachPrompts = [
  "How can I become a Product Manager?",
  "What skills should I learn?",
  "Why isn't my resume getting interviews?",
];

export default function CareerHubPage() {
  const overallScore = 74;

  return (
    <Page size="wide" className="jobvair-page career-hub-page">
      <section className="career-hub-hero">
        <div className="career-hub-hero__copy">
          <Badge tone="info" icon={Sparkles}>Career Hub</Badge>
          <h1>What should I do next to improve my career?</h1>
          <p>
            Jobvair turns your resume, goals, applications, and skills into a focused daily plan.
          </p>
          <div className="career-hub-hero__actions">
            <Button icon={WandSparkles}>Ask Jobvair</Button>
            <Button variant="secondary" icon={ClipboardCheck}>Review priorities</Button>
          </div>
        </div>

        <Card className="career-score-card">
          <div className="career-score-ring" style={{ "--score": `${overallScore}%` }}>
            <div>
              <span>{overallScore}</span>
              <small>Overall score</small>
            </div>
          </div>
          <h2>Career Readiness</h2>
          <p>Your next leap depends on LinkedIn polish and interview practice.</p>
        </Card>
      </section>

      <ResponsiveGrid min="190px" gap="16px" className="career-readiness-strip">
        {readiness.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label} className="career-readiness-tile">
              <span><Icon size={19} aria-hidden="true" /></span>
              <strong>{item.value}%</strong>
              <small>{item.label}</small>
              <div className="career-mini-bar" aria-hidden="true">
                <i style={{ width: `${item.value}%` }} />
              </div>
            </Card>
          );
        })}
      </ResponsiveGrid>

      <div className="career-hub-layout">
        <main className="career-hub-main">
          <Card className="priorities-card">
            <Section
              title="Today's Priorities"
              description="The highest-impact actions to improve career readiness today."
              actions={<Badge tone="success" icon={CheckCircle2}>2 complete</Badge>}
            >
              <div className="priority-list">
                {priorities.map((item) => (
                  <div className={item.done ? "priority-item priority-item--done" : "priority-item"} key={item.title}>
                    <span>{item.done ? <CheckCircle2 size={18} aria-hidden="true" /> : <CircleDot size={18} aria-hidden="true" />}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.impact}</small>
                    </div>
                    <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">Open</Button>
                  </div>
                ))}
              </div>
            </Section>
          </Card>

          <ResponsiveGrid min="270px" gap="18px">
            <Card>
              <Section title="Career Goals" description="Mock target state for your next role.">
                <div className="goal-grid">
                  {goals.map((goal) => {
                    const Icon = goal.icon;

                    return (
                      <div className="goal-tile" key={goal.label}>
                        <span><Icon size={18} aria-hidden="true" /></span>
                        <small>{goal.label}</small>
                        <strong>{goal.value}</strong>
                      </div>
                    );
                  })}
                </div>
              </Section>
            </Card>

            <Card>
              <Section title="Skills Gap Analysis" description="Where your next learning effort should go.">
                <div className="skills-gap">
                  <SkillGroup title="Current Skills" items={skills.current} tone="current" />
                  <SkillGroup title="Missing Skills" items={skills.missing} tone="missing" />
                  <SkillGroup title="Suggested Certifications" items={skills.certifications} tone="cert" />
                </div>
              </Section>
            </Card>
          </ResponsiveGrid>

          <ResponsiveGrid min="250px" gap="18px">
            {progress.map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.label} className="progress-card">
                  <span><Icon size={22} aria-hidden="true" /></span>
                  <strong>{item.value}%</strong>
                  <h3>{item.label}</h3>
                  <div className="career-mini-bar career-mini-bar--large" aria-hidden="true">
                    <i style={{ width: `${item.value}%` }} />
                  </div>
                  <p>{item.detail}</p>
                </Card>
              );
            })}
          </ResponsiveGrid>

          <Card>
            <Section title="Applications" description="Mock application status connected to your career plan.">
              <div className="application-list">
                {applications.map((application) => (
                  <div className="career-application-row" key={`${application.company}-${application.role}`}>
                    <span><BriefcaseBusiness size={18} aria-hidden="true" /></span>
                    <div>
                      <strong>{application.role}</strong>
                      <small>{application.company}</small>
                    </div>
                    <Badge tone="neutral">{application.stage}</Badge>
                    <em>{application.status}</em>
                  </div>
                ))}
              </div>
            </Section>
          </Card>
        </main>

        <aside className="career-hub-side">
          <Card className="career-coach-card">
            <div className="career-coach-card__icon">
              <Sparkles size={26} aria-hidden="true" />
            </div>
            <h2>AI Career Coach</h2>
            <p>Ask Jobvair what to do next, which skills matter, or why your search is stuck.</p>
            <Button full icon={WandSparkles}>Ask Jobvair</Button>
            <div className="coach-prompts">
              {coachPrompts.map((prompt) => (
                <button key={prompt} type="button">{prompt}</button>
              ))}
            </div>
          </Card>

          <Card className="next-step-card">
            <LightbulbHeader />
            <h2>Suggested next step</h2>
            <p>Complete LinkedIn and rewrite your summary before applying to the next Product Manager role.</p>
            <Button variant="secondary" full icon={PenLine}>Start next step</Button>
          </Card>

          <Card>
            <Section title="Learning / Next Step">
              <div className="learning-stack">
                <LearningItem icon={Award} label="Recommended certification" value="Product Management Certificate" />
                <LearningItem icon={BookOpenCheck} label="Recommended skill" value="Roadmap analytics" />
                <LearningItem icon={GraduationCapIcon} label="Practice focus" value="Metrics-based interview stories" />
              </div>
            </Section>
          </Card>
        </aside>
      </div>
    </Page>
  );
}

function SkillGroup({ title, items, tone }) {
  return (
    <div className="skill-group">
      <h3>{title}</h3>
      <div>
        {items.map((item) => <span className={`skill-chip skill-chip--${tone}`} key={item}>{item}</span>)}
      </div>
    </div>
  );
}

function LearningItem({ icon: Icon, label, value }) {
  return (
    <div className="learning-row">
      <span><Icon size={17} aria-hidden="true" /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function LightbulbHeader() {
  return (
    <span className="next-step-icon">
      <Sparkles size={20} aria-hidden="true" />
    </span>
  );
}

function GraduationCapIcon(props) {
  return <Trophy {...props} />;
}
