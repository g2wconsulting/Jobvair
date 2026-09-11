import { useEffect, useState } from "react";
import PublicJobsPage from "./PublicJobsPage.jsx";
import PublicJobDetailPage from "./PublicJobDetailPage.jsx";

// vercel.json rewrites both /jobs and /jobs/:slug to jobs.html, so this one
// entry point decides list vs. detail from the URL path itself.
function readRoute() {
  const parts = window.location.pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (parts[0] === "jobs" && parts[1]) return { view: "detail", slug: decodeURIComponent(parts[1]) };
  return { view: "list" };
}

export default function PublicJobsApp() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onPop = () => setRoute(readRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigateToJob = (slug) => {
    window.history.pushState({}, "", `/jobs/${slug}`);
    setRoute({ view: "detail", slug });
  };

  const navigateToList = () => {
    window.history.pushState({}, "", "/jobs");
    setRoute({ view: "list" });
  };

  if (route.view === "detail") {
    return <PublicJobDetailPage slug={route.slug} onBack={navigateToList} />;
  }
  return <PublicJobsPage onOpenJob={navigateToJob} />;
}
