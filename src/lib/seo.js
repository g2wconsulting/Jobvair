// Minimal client-side SEO helpers for the public job board — no
// react-helmet dependency needed for two pages. Sets <title>, meta
// description, canonical link, Open Graph tags, and one JSON-LD script.
// This runs after the initial paint (client-rendered), which Google's
// indexer (a JS-executing crawler) picks up; it is not a substitute for
// true server-side rendering, which most other crawlers/link-unfurlers
// still won't see. The dynamic sitemap (api/sitemap.js) is what actually
// gets each job URL discovered in the first place.

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function setPageMeta({ title, description, url, image }) {
  if (title) document.title = title;
  if (description) upsertMeta("name", "description", description);
  if (url) {
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);
  }
  if (title) upsertMeta("property", "og:title", title);
  if (description) upsertMeta("property", "og:description", description);
  if (url) upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:type", "website");
  if (image) upsertMeta("property", "og:image", image);
}

export function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function clearJsonLd(id) {
  document.getElementById(id)?.remove();
}
