import { useState } from "react";
import {
  LayoutDashboard, User, Layers, PenTool, Sparkles, FileText, Settings,
  Crown, ChevronDown, ChevronLeft, ChevronRight, CreditCard, HelpCircle, LogOut,
} from "lucide-react";
import { NAV } from "../constants/appConstants.js";
import "./Sidebar.css";

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  profile: User,
  resumes: Layers,
  builder: PenTool,
  "ai-optimize": Sparkles,
  "cover-letter": FileText,
  settings: Settings,
};

export default function Sidebar({ active, onNav, user, collapsed, onCollapse, onLogout }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const initials = user?.name ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "U";
  const isFree = user?.subscription === "free";

  return (
    <div className={`jv-sidebar${collapsed ? " jv-sidebar--collapsed" : ""}`}>
      <div className="jv-sidebar__brand">
        <div className="jv-sidebar__logo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        {!collapsed && <span className="jv-sidebar__name">Jobvair</span>}
      </div>

      <nav className="jv-sidebar__nav">
        {NAV.map(item => {
          const Icon = NAV_ICONS[item.id] || LayoutDashboard;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              title={collapsed ? item.label : undefined}
              className={`jv-nav-item${isActive ? " jv-nav-item--active" : ""}`}
              style={{ justifyContent: collapsed ? "center" : "flex-start" }}
            >
              <span className="jv-nav-item__icon"><Icon size={17} /></span>
              {!collapsed && <span className="jv-nav-item__label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!collapsed && isFree && (
        <div className="jv-sidebar__upsell">
          <div className="jv-sidebar__upsell-title"><Crown size={13} /> Free Plan</div>
          <p className="jv-sidebar__upsell-copy">Upgrade to unlock more AI credits and premium templates.</p>
          <div className="jv-sidebar__upsell-bar"><span style={{ width: "40%" }} /></div>
          <button className="jv-sidebar__upsell-link" onClick={() => onNav("settings")}>Upgrade to Pro →</button>
        </div>
      )}

      <div className="jv-sidebar__footer">
        <div style={{ position: "relative" }}>
          <button className="jv-sidebar__user" onClick={() => setUserMenuOpen(o => !o)}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #00BFA5, #1CC8EE)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12 }}>
                {initials}
              </div>
              {user?.idVerified && (
                <div style={{ position: "absolute", bottom: -2, right: -2, width: 12, height: 12, borderRadius: "50%", background: "#00BFA5", border: "2px solid #0b1f31", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#fff" }}>✓</div>
              )}
            </div>
            {!collapsed && (
              <>
                <div className="jv-sidebar__user-info">
                  <p className="jv-sidebar__user-name">{user?.name}</p>
                  <p className="jv-sidebar__user-meta">{isFree ? "Free Plan" : "Premium"}</p>
                </div>
                <ChevronDown size={13} color="rgba(255,255,255,0.4)" />
              </>
            )}
          </button>

          {userMenuOpen && (
            <div className="jv-sidebar__user-menu">
              <button className="jv-sidebar__user-menu-item" onClick={() => { onNav("profile"); setUserMenuOpen(false); }}>
                <User size={14} color="#667085" /> My Profile
              </button>
              <button className="jv-sidebar__user-menu-item" onClick={() => { onNav("settings"); setUserMenuOpen(false); }}>
                <CreditCard size={14} color="#667085" /> Billing
              </button>
              <button className="jv-sidebar__user-menu-item" onClick={() => setUserMenuOpen(false)}>
                <HelpCircle size={14} color="#667085" /> Help &amp; Support
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
