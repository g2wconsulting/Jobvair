// Thin employer-facing wrapper around the same assessment/question CMS
// Jobvair's own admin console uses — scoped to this company's own private
// content via the companyId prop (see 0018_employer_owned_assessments.sql
// for the RLS that makes this safe: a company can fully author its own
// assessments/questions, but never Jobvair's shared master library or
// another company's content).
import AssessmentsAdminPage from "../../admin/AssessmentsAdminPage.jsx";

export default function AssessmentBuilderPage({ company, user }) {
  return <AssessmentsAdminPage adminUser={user} companyId={company.id} />;
}
