import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardSummary, FoodRecord, NutrientSignal } from "./data/sampleDashboardData";
import westAfricaMapUrl from "./assets/west-africa-map.svg";

type ScoreFilter = "All" | "high" | "moderate" | "lower";
type DashboardData = {
  dashboardSummary: DashboardSummary;
  foodRecords: FoodRecord[];
  nutrientSignals: NutrientSignal[];
};

const scoreFormatter = (value: number) => value.toFixed(3);
const percentFormatter = (value: number) => `${value.toFixed(1)}%`;

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function uniqueSorted<T extends string>(values: T[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function IconBowl() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10h14c-.4 5-3.1 8-7 8s-6.6-3-7-8Z"/><path d="M7 10a5 5 0 0 1 10 0"/><path d="M9 7c-.8-1.7.8-2.1 0-3.4M12 7c-.8-1.7.8-2.1 0-3.4M15 7c-.8-1.7.8-2.1 0-3.4"/></svg>;
}
function IconLeaf() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4C12.5 4.3 6.8 8.3 5 16c6.8-.1 11.5-4.5 15-12Z"/><path d="M5 16c2.8-3.5 6.2-5.8 10.2-7"/></svg>;
}
function IconDoc() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6V3Z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></svg>;
}
function IconBars() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V10h3v10H5ZM11 20V5h3v15h-3ZM17 20v-8h3v8h-3Z"/></svg>;
}
function IconStar() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>;
}
function IconBook() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22V5.5Z"/><path d="M4 5.5A3.5 3.5 0 0 1 7.5 9H20"/></svg>;
}
function IconScale() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M5 6h14M7 6l-4 7h8L7 6ZM17 6l-4 7h8l-4-7Z"/><path d="M8 21h8"/></svg>;
}
function IconUsers() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M5 21a7 7 0 0 1 14 0M4 10a3 3 0 0 0 3 3M20 10a3 3 0 0 1-3 3"/></svg>;
}
function IconHeart() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 5.6a5.1 5.1 0 0 0-7.2 0L12 7.2l-1.6-1.6a5.1 5.1 0 1 0-7.2 7.2L12 21l8.8-8.2a5.1 5.1 0 0 0 0-7.2Z"/><path d="M7 12h3l1-2 2 5 1.2-3H17"/></svg>;
}

function HeroVisual() {
  return (
    <aside className="hero-visual map-visual" aria-label="Map of West Africa">
      <img src={westAfricaMapUrl} alt="Map of West Africa with the region highlighted" />
      <p>West Africa regional scope</p>
    </aside>
  );
}

function HeroAccentField() {
  return (
    <svg className="hero-accent-field" viewBox="0 0 980 330" aria-hidden="true">
      <g className="accent-depth accent-depth-back">
        <g className="hero-food-glyph hero-glyph-leaf" transform="translate(34 236) scale(.82) rotate(-12)">
          <path d="M13-13C-2-12-13-4-17 12-2 11 8 3 13-13Z" />
          <path d="M-17 12C-10 2-2-5 8-9" />
        </g>
        <g className="hero-food-glyph hero-glyph-signal" transform="translate(108 178) scale(.72)">
          <path d="M-10 10V1h5v9h-5ZM-2 10v-18h5v18h-5ZM6 10V-2h5v12H6Z" />
        </g>
        <g className="hero-food-glyph hero-glyph-bowl" transform="translate(248 304) scale(.7)">
          <path d="M-14 2h28c-1 12-6 18-14 18S-13 14-14 2Z" />
          <path d="M-8 2a8 8 0 0 1 16 0" />
        </g>
        <g className="hero-food-glyph hero-glyph-root" transform="translate(556 272) scale(.68) rotate(-16)">
          <path d="M-5-10c8 4 13 12 10 21-2 6-8 8-12 4-5-4-3-11 2-25Z" />
          <path d="M-5-10c-5-3-10-2-14 2M-5-10c-2-5 1-9 5-12M-5-10c3-4 8-5 13-3" />
        </g>
      </g>
      <g className="accent-depth accent-depth-mid">
        <g className="hero-food-glyph hero-glyph-leaf" transform="translate(92 256) scale(.9)">
          <path d="M13-13C-2-12-13-4-17 12-2 11 8 3 13-13Z" />
          <path d="M-17 12C-10 2-2-5 8-9" />
        </g>
        <g className="hero-food-glyph hero-glyph-signal" transform="translate(170 220) scale(.9)">
          <path d="M-10 10V1h5v9h-5ZM-2 10v-18h5v18h-5ZM6 10V-2h5v12H6Z" />
        </g>
        <g className="hero-food-glyph hero-glyph-bowl" transform="translate(286 246) scale(.84)">
          <path d="M-14 2h28c-1 12-6 18-14 18S-13 14-14 2Z" />
          <path d="M-8 2a8 8 0 0 1 16 0" />
          <path d="M-5-4c-2-4 2-5 0-8M0-4c-2-4 2-5 0-8M5-4c-2-4 2-5 0-8" />
        </g>
        <g className="hero-food-glyph hero-glyph-root" transform="translate(398 196) scale(.82)">
          <path d="M-5-10c8 4 13 12 10 21-2 6-8 8-12 4-5-4-3-11 2-25Z" />
          <path d="M-5-10c-5-3-10-2-14 2M-5-10c-2-5 1-9 5-12M-5-10c3-4 8-5 13-3" />
        </g>
        <g className="hero-food-glyph hero-glyph-leaf" transform="translate(520 152) scale(.92) rotate(-18)">
          <path d="M12-12C-3-10-12-3-16 12-2 11 8 3 12-12Z" />
          <path d="M-16 12C-9 3-2-4 8-8" />
        </g>
        <g className="hero-food-glyph hero-glyph-bowl" transform="translate(650 228) scale(.75)">
          <path d="M-14 2h28c-1 12-6 18-14 18S-13 14-14 2Z" />
          <path d="M-8 2a8 8 0 0 1 16 0" />
        </g>
        <g className="hero-food-glyph hero-glyph-signal" transform="translate(746 176) scale(.74)">
          <path d="M-10 10V1h5v9h-5ZM-2 10v-18h5v18h-5ZM6 10V-2h5v12H6Z" />
        </g>
      </g>
      <g className="accent-depth accent-depth-front">
        <g className="hero-food-glyph hero-glyph-signal" transform="translate(46 286) scale(.72)">
          <path d="M-10 10V1h5v9h-5ZM-2 10v-18h5v18h-5ZM6 10V-2h5v12H6Z" />
        </g>
        <g className="hero-food-glyph hero-glyph-root" transform="translate(722 278) scale(.72) rotate(12)">
          <path d="M-5-10c8 4 13 12 10 21-2 6-8 8-12 4-5-4-3-11 2-25Z" />
          <path d="M-5-10c-5-3-10-2-14 2M-5-10c-2-5 1-9 5-12M-5-10c3-4 8-5 13-3" />
        </g>
        <g className="hero-food-glyph hero-glyph-leaf" transform="translate(820 230) scale(.7) rotate(18)">
          <path d="M13-13C-2-12-13-4-17 12-2 11 8 3 13-13Z" />
          <path d="M-17 12C-10 2-2-5 8-9" />
        </g>
        <g className="hero-food-glyph hero-glyph-bowl" transform="translate(468 298) scale(.62)">
          <path d="M-14 2h28c-1 12-6 18-14 18S-13 14-14 2Z" />
          <path d="M-8 2a8 8 0 0 1 16 0" />
        </g>
        <circle className="hero-dot hero-dot-blue" cx="232" cy="276" r="4" />
        <circle className="hero-dot hero-dot-teal" cx="470" cy="244" r="4" />
        <circle className="hero-dot hero-dot-gold" cx="598" cy="306" r="4" />
        <circle className="hero-dot hero-dot-coral" cx="810" cy="264" r="4" />
      </g>
    </svg>
  );
}

function SignalValueLabel(props: { x?: number; y?: number; width?: number; value?: number; index?: number }) {
  const { x = 0, y = 0, width = 0, value = 0, index = 0 } = props;
  return (
    <text x={x + width + 8} y={y + 11} className={index === 0 ? "bar-label bar-label-emphasis" : "bar-label"}>
      {index === 0 ? `${percentFormatter(value)} • highest literature support` : percentFormatter(value)}
    </text>
  );
}

function App() {
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [nutrientFilter, setNutrientFilter] = useState("All");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let isMounted = true;
    import("./data/sampleDashboardData").then((module) => {
      if (isMounted) {
        setDashboardData({
          dashboardSummary: module.dashboardSummary,
          foodRecords: module.foodRecords,
          nutrientSignals: module.nutrientSignals,
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const dashboardSummary = dashboardData?.dashboardSummary;
  const foodRecords = dashboardData?.foodRecords ?? [];
  const nutrientSignals = dashboardData?.nutrientSignals ?? [];

  const nutrients = useMemo(() => uniqueSorted(foodRecords.flatMap((record) => record.keyNutrients)), [foodRecords]);
  const categories = useMemo(() => uniqueSorted(foodRecords.map((record) => record.category)), [foodRecords]);
  const mostSupportedSignal = nutrientSignals[0]?.nutrient || dashboardSummary?.mostSupportedSignal || "Iron";

  const resetFilters = () => {
    setDescriptionSearch("");
    setNutrientFilter("All");
    setScoreFilter("All");
    setCategoryFilter("All");
  };

  const filteredFoods = useMemo(() => {
    const query = normalize(descriptionSearch);
    return foodRecords
      .filter((record) => {
        const matchesSearch = query.length === 0 || normalize(record.food).includes(query);
        const matchesNutrient =
          nutrientFilter === "All" || record.keyNutrients.some((nutrient) => normalize(nutrient) === normalize(nutrientFilter));
        const matchesCategory = categoryFilter === "All" || record.category === categoryFilter;
        const matchesScore =
          scoreFilter === "All" ||
          (scoreFilter === "high" && record.finalScore >= 0.7) ||
          (scoreFilter === "moderate" && record.finalScore >= 0.4 && record.finalScore < 0.7) ||
          (scoreFilter === "lower" && record.finalScore < 0.4);
        return matchesSearch && matchesNutrient && matchesCategory && matchesScore;
      })
      .sort((a, b) => a.rank - b.rank);
  }, [categoryFilter, descriptionSearch, nutrientFilter, scoreFilter]);

  const topFoods = filteredFoods.slice(0, 5);
  const tableFoods = filteredFoods.slice(0, 8);
  const maxScore = Math.max(1, ...foodRecords.map((record) => record.finalScore));

  const kpis = [
    { label: "Foods analyzed", value: dashboardSummary ? dashboardSummary.foodsAnalyzed.toLocaleString() : "-", icon: <IconBowl /> },
    { label: "Nutrients retained", value: dashboardSummary ? dashboardSummary.nutrientsRetained.toString() : "-", icon: <IconLeaf /> },
    { label: "Research abstracts reviewed", value: dashboardSummary ? dashboardSummary.pubmedAbstractsScreened.toLocaleString() : "-", icon: <IconDoc /> },
    { label: "Most-supported nutrient deficiency", value: mostSupportedSignal, icon: <IconBars /> },
    { label: "Top-ranked food", value: "Carrot", icon: <IconStar /> },
  ];

  return (
    <main className="app-shell">
      <section
        className="hero-grid"
        aria-labelledby="dashboard-title"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty("--hero-mx", `${(event.clientX - rect.left) / rect.width - 0.5}`);
          event.currentTarget.style.setProperty("--hero-my", `${(event.clientY - rect.top) / rect.height - 0.5}`);
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.setProperty("--hero-mx", "0");
          event.currentTarget.style.setProperty("--hero-my", "0");
        }}
      >
        <HeroAccentField />
        <div className="hero-copy">
          <p className="eyebrow">Nutrition insights for West Africa</p>
          <h1 id="dashboard-title">Finding the foods that matter most</h1>
          <p className="hero-statement">This dashboard ranks West African foods using nutrient composition data and research evidence related to nutrient deficiencies.</p>
          <p className="hero-problem">Focused on nutrient gaps involving iron, vitamin A, zinc, and related nutrients.</p>
        </div>
        <HeroVisual />
      </section>

      <section className="kpi-grid" aria-label="Dashboard summary">
        {kpis.map((kpi) => (
          <article className="kpi-card" key={kpi.label}>
            <div className="kpi-icon">{kpi.icon}</div>
            <div>
              <p className="kpi-label">{kpi.label}</p>
              <p className="kpi-value">{kpi.value}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="analytical-workspace" aria-labelledby="controls-title">
        <section className="controls-card">
          <div className="section-title-row">
            <div>
              <h2 id="controls-title">Explore the data</h2>
            </div>
          </div>
          <div className="control-grid">
            <label>
              <span>Nutrient focus</span>
              <select value={nutrientFilter} onChange={(event) => setNutrientFilter(event.target.value)}>
                <option value="All">Choose a nutrient...</option>
                {nutrients.map((nutrient) => <option key={nutrient} value={nutrient}>{nutrient}</option>)}
              </select>
            </label>
            <label>
              <span>Priority score range</span>
              <select value={scoreFilter} onChange={(event) => setScoreFilter(event.target.value as ScoreFilter)}>
                <option value="All">All scores</option>
                <option value="high">High priority (0.70+)</option>
                <option value="moderate">Moderate priority (0.40-0.69)</option>
                <option value="lower">Lower priority (&lt;0.40)</option>
              </select>
            </label>
            <label className="secondary-filter">
              <span>Food category</span>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="All">All categories</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="description-search">
              <span>Search food description</span>
              <input type="search" value={descriptionSearch} onChange={(event) => setDescriptionSearch(event.target.value)} placeholder="e.g., carrot, leaves, boiled, raw, dried" />
            </label>
            <button className="reset-button" type="button" onClick={resetFilters}>Reset filters</button>
          </div>
        </section>

        <section className="main-grid" aria-label="Main dashboard visualizations">
          <article className="panel-card priority-card">
            <div className="section-title-row compact">
              <div>
                <h2>Top prioritized foods</h2>
                <p>Higher scores indicate stronger overall priority.</p>
              </div>
            </div>
            {topFoods.length > 0 ? (
              <div className="ranked-list">
                <div className="ranked-header"><span>Rank</span><span>Food</span><span>Priority score</span></div>
                {topFoods.map((record) => (
                  <div className={`ranked-row ${record.rank === 1 ? "top-row" : ""}`} key={record.id}>
                    <span className="rank-number">{record.rank}</span>
                    <div className="food-summary">
                      <strong>{record.food}</strong>
                      <small>{record.category}{record.rank === 1 ? " • highest overall priority" : ""}</small>
                    </div>
                    <div className="score-bar-wrap"><div className="score-bar" style={{ width: `${Math.max(7, (record.finalScore / maxScore) * 100)}%` }} /></div>
                    <span className="score-value">{scoreFormatter(record.finalScore)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><p>No foods match these filters. Try clearing the nutrient or category filter.</p><button type="button" onClick={resetFilters}>Reset filters</button></div>
            )}
          </article>

          <article className="panel-card signal-card">
            <div className="section-title-row compact">
              <div>
                <h2>Nutrient deficiency signals from literature</h2>
                <p>Normalized support across reviewed abstracts.</p>
              </div>
            </div>
            <div className="signal-chart" aria-label="Normalized nutrient literature support chart">
              <ResponsiveContainer width="100%" height={318}>
                <BarChart data={nutrientSignals} layout="vertical" margin={{ top: 2, right: 154, left: 42, bottom: 20 }} barCategoryGap={12}>
                  <CartesianGrid strokeDasharray="2 2" horizontal={false} stroke="#eef4f6" />
                  <XAxis type="number" domain={[0, 55]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 12, fill: "#07183a", fontFamily: "inherit" }} label={{ value: "Literature support (normalized %)", position: "insideBottom", offset: -8, style: { fill: "#07183a", fontSize: 12, fontFamily: "inherit" } }} />
                  <YAxis dataKey="nutrient" type="category" tick={{ fontSize: 12, fill: "#07183a", fontFamily: "inherit" }} width={76} />
                  <Tooltip formatter={(value: number) => [percentFormatter(value), "Literature support"]} />
                  <Bar dataKey="supportPercent" radius={[0, 2, 2, 0]} barSize={12}>
                    {nutrientSignals.map((signal, index) => <Cell key={signal.nutrient} fill={index === 0 ? "#EA7317" : "#FEC601"} />)}
                    <LabelList dataKey="supportPercent" content={<SignalValueLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="panel-card results-card" aria-labelledby="results-title">
          <div className="section-title-row compact">
            <div>
              <h2 id="results-title">Searchable results</h2>
              <p>Filtered ranking preview.</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Rank</th><th>Food</th><th>Category</th><th>Priority score</th><th>Key nutrients</th><th>Evidence level</th></tr></thead>
              <tbody>
                {tableFoods.map((record: FoodRecord) => (
                  <tr key={record.id}>
                    <td>{record.rank}</td><td>{record.food}</td><td>{record.category}</td><td>{scoreFormatter(record.finalScore)}</td><td>{record.keyNutrients.join(", ")}</td><td><span className={`status ${record.evidenceStrength.toLowerCase()}`}>{record.evidenceStrength}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tableFoods.length === 0 && <div className="empty-state table-empty"><p>No foods match these filters. Try clearing the nutrient or category filter.</p><button type="button" onClick={resetFilters}>Reset filters</button></div>}
          </div>
        </section>
      </section>

      <section className="interpretation-section" aria-labelledby="interpretation-title">
        <h2 id="interpretation-title">How to interpret this dashboard</h2>
        <div className="interpretation-grid">
          <article className="interpretation-card"><IconBook /><div><h3>Research evidence</h3><p>I referenced nutrition studies to see which nutrient gaps appear most often.</p></div></article>
          <article className="interpretation-card"><IconBars /><div><h3>Nutrient weighting</h3><p>Nutrients mentioned more often in deficiency literature receive more weight.</p></div></article>
          <article className="interpretation-card"><IconScale /><div><h3>Food ranking</h3><p>Foods are scored based on how well they provide the nutrients that matter most.</p></div></article>
          <article className="interpretation-card"><IconUsers /><div><h3>Decision support</h3><p>These results can help identify local foods for further nutrition planning, but they are not direct dietary advice.</p></div></article>
        </div>
      </section>
    </main>
  );
}

export default App;
