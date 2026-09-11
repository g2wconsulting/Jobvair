import { useState } from "react";
import {
  LayoutDashboard, Briefcase, Users, GitBranch, LineChart, Building2,
  CreditCard, Settings, ChevronDown, ChevronLeft, ChevronRight, LogOut, ClipboardCheck, UserSearch,
} from "lucide-react";
import { EMPLOYER_NAV } from "../constants.js";
import { hasFeature } from "../featureFlags.js";
import "../../components/Sidebar.css";

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  jobs: Briefcase,
  candidates: Users,
  "talent-search": UserSearch,
  assessments: ClipboardCheck,
  hiring: GitBranch,
  intelligence: LineChart,
  company: Building2,
  billing: CreditCard,
  settings: Settings,
};

export default function EmployerSidebar({ active, onNav, company, membership, collapsed, onCollapse, onLogout, features }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const initials = company?.name ? company.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "CO";
  const visibleNav = EMPLOYER_NAV.filter(item => !item.featureKey || hasFeature(features, item.featureKey));

  return (
    <div className={`jv-sidebar${collapsed ? " jv-sidebar--collapsed" : ""}`}>
      <div className="jv-sidebar__brand">
        <div className="jv-sidebar__logo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        {!collapsed && <span className="jv-sidebar__name">Jobvair <span style={{ opacity: 0.5, fontWeight: 500, fontSize: 12 }}>for Business</span></span>}
      </div>

      <nav className="jv-sidebar__nav">
        {visibleNav.map(item => {
          const Icon = NAV_ICONS[item.id] || LayoutDashboard;
          const isActive = active === item.id;
          const visibleChildren = (item.children || []).filter(child => !child.featureKey || hasFeature(features, child.featureKey));
          return (
            <div key={item.id}>
              <button
                onClick={() => onNav(item.id)}
                title={collapsed ? item.label : undefined}
                className={`jv-nav-item${isActive ? " jv-nav-item--active" : ""}`}
                style={{ justifyContent: collapsed ? "center" : "flex-start" }}
              >
                <span className="jv-nav-item__icon"><Icon size={17} /></span>
                {!collapsed && <span className="jv-nav-item__label">{item.label}</span>}
              </button>
              {!collapsed && visibleChildren.map(child => {
                const ChildIcon = NAV_ICONS[child.id] || Icon;
                const isChildActive = active === child.id;
                return (
                  <button
                    key={child.id}
                    onClick={() => onNav(child.id)}
                    className={`jv-nav-item${isChildActive ? " jv-nav-item--active" : ""}`}
                    style={{ justifyContent: "flex-start", paddingLeft: 40, fontSize: 13 }}
                  >
                    <span className="jv-nav-item__icon"><ChildIcon size={14} /></span>
                    <span className="jv-nav-item__label">{child.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="jv-sidebar__footer">
        <div style={{ position: "relative" }}>
          <button className="jv-sidebar__user" onClick={() => setUserMenuOpen(o => !o)}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #00BFA5, #1CC8EE)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="jv-sidebar__user-info">
                  <p className="jv-sidebar__user-name">{company?.name || "Your Company"}</p>
                  <p className="jv-sidebar__user-meta">{membership?.role?.replace("_", " ") || "Member"}</p>
                </div>
                <ChevronDown size={13} color="rgba(255,255,255,0.4)" />
              </>
            )}
          </button>

          {userMenuOpen && (
            <div className="jv-sidebar__user-menu">
              <button className="jv-sidebar__user-menu-item" onClick={() => { onNav("company"); setUserMenuOpen(false); }}>
                <Building2 size={14} color="#667085" /> Company Profile
              </button>
              <button className="jv-sidebar__user-menu-item" onClick={() => { onNav("billing"); setUserMenuOpen(false); }}>
                <CreditCard size={14} color="#667085" /> Billing
              </button>
              <div className="jv-sidebar__user-menu-divider" />
              <button className="jv-sidebar__user-menu-item jv-sidebar__user-menu-item--danger" onClick={() => { setUserMenuOpen(false); onLogout?.(); }}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <button className="jv-sidebar__collapse" onClick={onCollapse} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </div>
  );
}
