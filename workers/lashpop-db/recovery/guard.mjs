import config from "./rules.json" with {type: "json"};
export function normalize(sql) { return sql.trim().replace(/\s+/g, " ").replace(/\(\?(?:, ?\?)*\)/g, "(?...) ").trim().toLowerCase(); }
const rules = config.rules.map(r => ({...r, normalized: normalize(r.sql)}));
const team = new Set(config.teamIds), slugs = new Set(config.slugs), reviews = new Set(config.reviewIds);
const sections = new Set(["hero_slideshow_assignments","founder_letter","hero_archway","hero_slideshow_presets","hero_content","homepage_services","instagram_carousel","seo_metadata","studio"]);
export function isPublicRead(input) {
  if (!input || !["all", "values", "get"].includes(input.method) || typeof input.sql !== "string" || !/^\s*select\s/i.test(input.sql) || /;|--|\/\*/.test(input.sql) || !Array.isArray(input.params)) return false;
  if ((input.sql.match(/\?/g) || []).length !== input.params.length) return false;
  const r = rules.find(r => r.normalized === normalize(input.sql)); if (!r) return false;
  const p = input.params;
  switch (r.kind) {
    case "exact": return JSON.stringify(p) === JSON.stringify(r.params);
    case "service-slug": return p.length===2 && slugs.has(p[0]) && p[1]===1;
    case "public-setting": return p.length===2 && sections.has(p[0]) && p[1]===1;
    case "team-ids": return p.length>0 && p.every(id=>team.has(id));
    case "team-photos": return p.length>1 && p.at(-1)===1 && p.slice(0,-1).every(id=>team.has(id));
    case "review-ids": return p.length>1 && p.at(-1)===1 && p.slice(0,-1).every(id=>reviews.has(id));
    case "high-rated": return p.length===3 && p[0]===4 && p[1]===1 && Number.isInteger(p[2]) && p[2]>0 && p[2]<=20;
    default: return false;
  }
}
