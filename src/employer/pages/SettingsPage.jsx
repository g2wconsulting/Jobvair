import { Page, PageHeader, Card, Button, Section } from "../../components/ui/index.js";

export default function EmployerSettingsPage({ user, membership, onLogout }) {
  return (
    <Page size="wide">
      <PageHeader eyebrow="Settings" title="Settings" />
      <Card>
        <Section title="Your account">
          <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Role:</strong> {membership?.role?.replace("_", " ") || "—"}</div>
          </div>
        </Section>
      </Card>
      <Card style={{ marginTop: 16 }}>
        <Section title="Session">
          <Button variant="danger" onClick={onLogout}>Sign out</Button>
        </Section>
      </Card>
    </Page>
  );
}
