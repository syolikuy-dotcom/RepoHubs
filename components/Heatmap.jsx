import Link from "next/link";
import { graphql, safe } from "@/lib/github";

const STEP = 13, LEFT = 28, TOP = 18;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** Grafik kontribusi ala GitHub (GraphQL contributionsCollection). */
export default async function Heatmap({ login, year, base }) {
  const now = new Date().getFullYear();
  const vars = { login, from: year ? `${year}-01-01T00:00:00Z` : null, to: year ? `${year}-12-31T23:59:59Z` : null };
  const data = await safe(graphql(
    `query($login:String!,$from:DateTime,$to:DateTime){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{totalContributions weeks{contributionDays{date weekday contributionCount}}}}}}`, vars), null);
  const cal = data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) return null;
  const max = Math.max(1, ...cal.weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount)));
  const level = (c) => (c === 0 ? 0 : Math.min(4, Math.ceil((c / max) * 4)));
  const w = LEFT + cal.weeks.length * STEP;
  let lastMonth = -1;
  return (
    <div className="box mb-3">
      <div className="box-header"><span className="box-title">{cal.totalContributions.toLocaleString("id-ID")} kontribusi {year ? `pada ${year}` : "dalam setahun terakhir"}</span><span className="grow" />
        {[now, now - 1, now - 2].map((y) => <Link key={y} href={`${base}?year=${y}`} className={`btn btn-sm ${year === y ? "btn-primary" : ""}`}>{y}</Link>)}
        {year && <Link href={base} className="btn btn-sm">Terbaru</Link>}</div>
      <div className="box-body">
        <div className="heat">
          <svg width={w} height={TOP + 7 * STEP} role="img" aria-label="Grafik kontribusi">
            {cal.weeks.map((wk, x) => {
              const m = new Date(wk.contributionDays[0].date).getUTCMonth();
              const label = m !== lastMonth && x < cal.weeks.length - 2 ? ((lastMonth = m), MONTHS[m]) : null;
              return label ? <text key={`m${x}`} x={LEFT + x * STEP} y={10} fontSize="10" fill="var(--fg-muted)">{label}</text> : null;
            })}
            {["Sen", "Rab", "Jum"].map((d, i) => <text key={d} x={0} y={TOP + (i * 2 + 1) * STEP + 9} fontSize="10" fill="var(--fg-muted)">{d}</text>)}
            {cal.weeks.map((wk, x) => wk.contributionDays.map((d) => (
              <rect key={d.date} x={LEFT + x * STEP} y={TOP + d.weekday * STEP} width="10" height="10" rx="2" fill={`var(--h${level(d.contributionCount)})`} stroke="rgba(128,128,128,.12)">
                <title>{d.contributionCount} kontribusi pada {d.date}</title>
              </rect>
            )))}
          </svg>
        </div>
        <div className="heat-legend">Sedikit {[0, 1, 2, 3, 4].map((l) => <i key={l} style={{ background: `var(--h${l})` }} />)} Banyak</div>
      </div>
    </div>
  );
}
