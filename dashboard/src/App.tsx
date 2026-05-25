import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
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
type DirectionalityMode = "weighted" | "desirable" | "undesirable";
type SortKey = "rank" | "food" | "score" | "evidence";

type DashboardData = {
  dashboardSummary: DashboardSummary;
  foodRecords: FoodRecord[];
  nutrientSignals: NutrientSignal[];
};

const metadata = [
  { label: "WAFCT entries screened", value: "1,028" },
  { label: "Foods ranked", value: "834" },
  { label: "Nutrients retained", value: "17" },
  { label: "Missingness threshold", value: "<=10%" },
  { label: "PubMed corpus", value: "675 abstracts" },
  { label: "Ranking method", value: "TOPSIS MCDA" },
];

const workflowStreams = [
  {
    label: "Food composition stream",
    items: [
      "FAO/INFOODS WAFCT input",
      "Eligibility screening",
      "Net carbohydrate derivation",
      "Complete-case filtering",
      "Retained nutrient matrix",
    ],
  },
  {
    label: "Literature signal stream",
    items: [
      "Cached PubMed titles/abstracts",
      "Deficiency-language scan",
      "Nutrient co-occurrence counts",
      "Literature-derived weights",
      "Directionality assignment",
    ],
  },
];

const convergenceSteps = [
  "Weighted normalization",
  "Ideal / worst-case profiles",
  "TOPSIS proximity score",
  "Post-hoc RDI interpretation",
  "Ranked candidate-food outputs",
];

const scoreDistribution = [
  { bin: "0.00-0.04", foods: 182 },
  { bin: "0.04-0.08", foods: 347 },
  { bin: "0.08-0.12", foods: 171 },
  { bin: "0.12-0.20", foods: 84 },
  { bin: "0.20-0.40", foods: 41 },
  { bin: "0.40-0.60", foods: 6 },
  { bin: "0.60-0.80", foods: 3 },
];

const rdiNutrients = ["Iron", "Vitamin A", "Copper", "Folate", "Vitamin B12", "Magnesium"];
const rdiCoverage = [
  { food: "Carrot, boiled", values: [18, 115, 8, 6, 0, 3] },
  { food: "Onion, boiled", values: [22, 0, 19, 5, 0, 4] },
  { food: "Jute mallow leaves", values: [41, 18, 21, 29, 0, 24] },
  { food: "Benniseed, raw", values: [35, 0, 56, 21, 0, 82] },
  { food: "Cowpea leaves", values: [38, 16, 45, 36, 0, 31] },
  { food: "Fonio, raw", values: [28, 0, 18, 13, 0, 35] },
  { food: "Shrimp, dried", values: [7, 0, 63, 3, 88, 14] },
  { food: "Beef liver", values: [36, 245, 980, 58, 2500, 6] },
];

const assumptions = [
  { term: "Complete-case filtering", detail: "Foods with missing retained nutrient values are removed after the <=10% nutrient missingness rule." },
  { term: "No imputation", detail: "Missing nutrient values are not imputed before ranking to avoid artificial nutrient profiles." },
  { term: "Nutrient directionality", detail: "Beneficial nutrients are rewarded at higher values; sodium, saturated fat, and related nutrients are treated as lower-is-better." },
  { term: "Literature-derived weights", detail: "Weights are normalized from deficiency-related nutrient co-occurrence in PubMed titles and abstracts." },
  { term: "Comparative score", detail: "A TOPSIS score is relative to the constructed ideal and worst-case profiles, not an absolute dietary recommendation." },
];

const limitations = [
  "PubMed co-occurrence does not assess study quality, effect sizes, causality, or deficiency prevalence.",
  "The current model uses nutrient values per 100 g and does not yet encode serving size, cost, seasonality, food safety, bioavailability, or cultural dietary patterns.",
  "The dashboard is a decision-support artifact for inspection and expert review, not a finalized recommendation system.",
];

const scoreFormatter = (value: number) => value.toFixed(3);
const percentFormatter = (value: number) => `${value.toFixed(1)}%`;

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function uniqueSorted<T extends string>(values: T[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function SignalValueLabel(props: { x?: number; y?: number; width?: number; value?: number; index?: number }) {
  const { x = 0, y = 0, width = 0, value = 0, index = 0 } = props;
  const label = index === 0 ? `${percentFormatter(value)} / dominant signal` : percentFormatter(value);
  return (
    <text x={x + width + 8} y={y + 10} className="bar-label">
      {label}
    </text>
  );
}

function HeroVisual() {
  return (
    <aside className="map-panel" aria-label="West Africa analytical region">
      <img src={westAfricaMapUrl} alt="Map outline of West Africa" />
      <div>
        <span>Regional scope</span>
        <strong>West Africa Food Composition Table</strong>
      </div>
    </aside>
  );
}

function App() {
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [nutrientFilter, setNutrientFilter] = useState("All");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [directionalityMode, setDirectionalityMode] = useState<DirectionalityMode>("weighted");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
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

  const resetFilters = () => {
    setDescriptionSearch("");
    setNutrientFilter("All");
    setScoreFilter("All");
    setCategoryFilter("All");
    setDirectionalityMode("weighted");
    setSortKey("rank");
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
      .sort((a, b) => {
        if (sortKey === "food") return a.food.localeCompare(b.food);
        if (sortKey === "score") return b.finalScore - a.finalScore;
        if (sortKey === "evidence") return a.evidenceStrength.localeCompare(b.evidenceStrength) || a.rank - b.rank;
        return a.rank - b.rank;
      });
  }, [categoryFilter, descriptionSearch, foodRecords, nutrientFilter, scoreFilter, sortKey]);

  const topFoods = filteredFoods.slice(0, 8);
  const tableFoods = filteredFoods.slice(0, 14);
  const maxScore = Math.max(1, ...foodRecords.map((record) => record.finalScore));
  const mostSupportedSignal = nutrientSignals[0]?.nutrient || dashboardSummary?.mostSupportedSignal || "Iron";

  const displayedSignals = useMemo(() => {
    if (directionalityMode === "desirable") return nutrientSignals.filter((signal) => signal.nutrient !== "Sodium" && signal.nutrient !== "Net carbs");
    if (directionalityMode === "undesirable") return nutrientSignals.filter((signal) => signal.nutrient === "Sodium" || signal.nutrient === "Net carbs");
    return nutrientSignals;
  }, [directionalityMode, nutrientSignals]);

  return (
    <main className="app-shell">
      <section className="hero-grid" aria-labelledby="dashboard-title">
        <div className="hero-copy">
          <h1 id="dashboard-title">Text-Informed Nutritional Prioritization in West Africa</h1>
          <p className="hero-statement">
            Literature-weighted TOPSIS ranking of eligible WAFCT foods using deficiency-related PubMed signals.
          </p>
          <div className="hero-meta" aria-label="Default pipeline run metadata">
            {metadata.map((item) => (
              <div className="meta-item" key={item.label}>
                <span>{item.label}</span>
                <strong>{dashboardSummary && item.label === "Foods ranked" ? dashboardSummary.foodsAnalyzed.toLocaleString() : item.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <HeroVisual />
      </section>

      <section className="summary-strip" aria-label="Current default run summary">
        <div>
          <span>Highest-ranked food</span>
          <strong>{dashboardSummary?.highestRankedFood ?? "Carrot, boiled, drained"}</strong>
        </div>
        <div>
          <span>Most-supported literature signal</span>
          <strong>{mostSupportedSignal}</strong>
        </div>
        <div>
          <span>Eligibility exclusions</span>
          <strong>26 excluded / 2 review flags</strong>
        </div>
        <div>
          <span>Score distribution</span>
          <strong>Mean 0.089 / median 0.071</strong>
        </div>
      </section>

      <section className="pipeline-section" aria-labelledby="pipeline-title">
        <div className="section-heading">
          <p className="eyebrow">A pipeline built around two questions</p>
          <h2 id="pipeline-title">From food composition data and biomedical text to candidate-food ranking</h2>
          <p>
            The framework first determines which WAFCT foods can be responsibly ranked, then estimates which nutrients should receive
            greater model weight from deficiency-related biomedical literature.
          </p>
        </div>
        <div className="pipeline-grid">
          {workflowStreams.map((stream) => (
            <article className="stream-panel" key={stream.label}>
              <h3>{stream.label}</h3>
              <ol>
                {stream.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </article>
          ))}
          <article className="convergence-panel">
            <h3>Model convergence</h3>
            <ol>
              {convergenceSteps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <section className="analytical-workspace" aria-labelledby="controls-title">
        <section className="controls-panel">
          <div className="section-title-row">
            <div>
              <h2 id="controls-title">Inspection Controls</h2>
              <p>Filter the candidate-food preview and switch between model and interpretive views.</p>
            </div>
            <button className="reset-button" type="button" onClick={resetFilters}>
              Reset
            </button>
          </div>
          <div className="control-grid">
            <label>
              <span>Nutrient focus</span>
              <select value={nutrientFilter} onChange={(event) => setNutrientFilter(event.target.value)}>
                <option value="All">All retained nutrients</option>
                {nutrients.map((nutrient) => (
                  <option key={nutrient} value={nutrient}>
                    {nutrient}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>TOPSIS score band</span>
              <select value={scoreFilter} onChange={(event) => setScoreFilter(event.target.value as ScoreFilter)}>
                <option value="All">All scores</option>
                <option value="high">High tail (&gt;=0.70)</option>
                <option value="moderate">Upper middle (0.40-0.69)</option>
                <option value="lower">Lower / middle (&lt;0.40)</option>
              </select>
            </label>
            <label>
              <span>Food category</span>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="All">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Sort table</span>
              <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
                <option value="rank">Rank ascending</option>
                <option value="score">Score descending</option>
                <option value="food">Food description</option>
                <option value="evidence">Evidence strength</option>
              </select>
            </label>
            <label className="description-search">
              <span>Food description search</span>
              <input
                type="search"
                value={descriptionSearch}
                onChange={(event) => setDescriptionSearch(event.target.value)}
                placeholder="carrot, leaves, liver, fonio"
              />
            </label>
          </div>
          <div className="toggle-row" aria-label="Analytical toggles">
            {(["weighted", "desirable", "undesirable"] as DirectionalityMode[]).map((mode) => (
              <button
                className={directionalityMode === mode ? "toggle active" : "toggle"}
                type="button"
                key={mode}
                onClick={() => setDirectionalityMode(mode)}
              >
                {mode === "weighted" ? "All weighted nutrients" : mode === "desirable" ? "Higher-is-better" : "Lower-is-better"}
              </button>
            ))}
          </div>
        </section>

        <section className="main-grid" aria-label="Primary figures">
          <article className="panel-card priority-card">
            <div className="section-title-row compact">
              <div>
                <h2>Top Complete-Case Foods</h2>
                <p>Relative TOPSIS proximity score under the default literature-weighted model.</p>
              </div>
              <span className="figure-label">Fig. 01</span>
            </div>
            {topFoods.length > 0 ? (
              <div className="ranked-list">
                <div className="ranked-header">
                  <span>Rank</span>
                  <span>Food</span>
                  <span>Score</span>
                </div>
                {topFoods.map((record) => (
                  <div className="ranked-row" key={record.id}>
                    <span className="rank-number">{record.rank}</span>
                    <div className="food-summary">
                      <strong>{record.food}</strong>
                      <small>{record.category} / {record.keyNutrients.join(", ")}</small>
                    </div>
                    <div className="score-bar-wrap">
                      <div className="score-bar" style={{ width: `${Math.max(4, (record.finalScore / maxScore) * 100)}%` }} />
                    </div>
                    <span className="score-value">{scoreFormatter(record.finalScore)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No foods match these filters.</p>
                <button type="button" onClick={resetFilters}>Reset</button>
              </div>
            )}
          </article>

          <article className="panel-card signal-card">
            <div className="section-title-row compact">
              <div>
                <h2>Literature Signal Distribution</h2>
                <p>Normalized nutrient weights from deficiency-related PubMed co-occurrence.</p>
              </div>
              <span className="figure-label">Fig. 02</span>
            </div>
            <div className="signal-chart" aria-label="Normalized nutrient literature support chart">
              <ResponsiveContainer width="100%" height={330}>
                <BarChart data={displayedSignals} layout="vertical" margin={{ top: 2, right: 148, left: 40, bottom: 18 }} barCategoryGap={10}>
                  <CartesianGrid strokeDasharray="1 3" horizontal={false} stroke="#d8d8d8" />
                  <XAxis
                    type="number"
                    domain={[0, 55]}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fontSize: 11, fill: "#202020", fontFamily: "inherit" }}
                    label={{ value: "Normalized weight (%)", position: "insideBottom", offset: -8, style: { fill: "#202020", fontSize: 11, fontFamily: "inherit" } }}
                  />
                  <YAxis dataKey="nutrient" type="category" tick={{ fontSize: 11, fill: "#202020", fontFamily: "inherit" }} width={76} />
                  <Tooltip formatter={(value: number, _name, item) => [`${percentFormatter(value)}; n=${item.payload.supportCount}`, "Literature signal"]} />
                  <Bar dataKey="supportPercent" radius={0} barSize={12}>
                    {displayedSignals.map((signal, index) => (
                      <Cell key={signal.nutrient} fill={index === 0 ? "#1f5fbf" : "#666666"} />
                    ))}
                    <LabelList dataKey="supportPercent" content={<SignalValueLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="distribution-grid" aria-label="Secondary analytical figures">
          <article className="panel-card">
            <div className="section-title-row compact">
              <div>
                <h2>TOPSIS Score Distribution</h2>
                <p>TOPSIS ranks foods by closeness to the weighted ideal profile and distance from the worst-case profile after normalization.</p>
              </div>
              <span className="figure-label">Fig. 03</span>
            </div>
            <ResponsiveContainer width="100%" height={236}>
              <BarChart data={scoreDistribution} margin={{ top: 4, right: 12, left: 0, bottom: 24 }}>
                <CartesianGrid vertical={false} stroke="#dedede" strokeDasharray="1 3" />
                <XAxis dataKey="bin" tick={{ fontSize: 10, fill: "#202020" }} interval={0} angle={-28} textAnchor="end" height={52} />
                <YAxis tick={{ fontSize: 11, fill: "#202020" }} width={42} />
                <Tooltip formatter={(value: number) => [value, "Foods"]} />
                <Bar dataKey="foods" fill="#111111" radius={0} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
            <p className="caption">Reported default run: mean 0.089, median 0.071, P90-P10 spread 0.068.</p>
          </article>

          <article className="panel-card">
            <div className="section-title-row compact">
              <div>
                <h2>RDI Contribution Matrix</h2>
                <p>Post-hoc nutrient contribution bands for selected top-ranked foods; values are percent daily value per 100 g.</p>
              </div>
              <span className="figure-label">Fig. 04</span>
            </div>
            <div className="heatmap" role="table" aria-label="RDI contribution matrix">
              <div className="heatmap-row heatmap-head" role="row">
                <span role="columnheader">Food</span>
                {rdiNutrients.map((nutrient) => (
                  <span role="columnheader" key={nutrient}>{nutrient}</span>
                ))}
              </div>
              {rdiCoverage.map((row) => (
                <div className="heatmap-row" role="row" key={row.food}>
                  <span role="cell">{row.food}</span>
                  {row.values.map((value, index) => (
                    <span
                      role="cell"
                      className={value >= 80 ? "heat-cell high" : "heat-cell"}
                      style={{ "--intensity": Math.min(1, value / 120).toString() } as CSSProperties}
                      key={`${row.food}-${rdiNutrients[index]}`}
                    >
                      {value}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel-card results-card" aria-labelledby="results-title">
          <div className="section-title-row compact">
            <div>
              <h2 id="results-title">Ranked Candidate Foods</h2>
              <p>Filtered preview of eligible complete-case foods with retained nutrient descriptors.</p>
            </div>
            <span className="record-count">{filteredFoods.length} records</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>WAFCT ID</th>
                  <th>Food description</th>
                  <th>Category</th>
                  <th>TOPSIS score</th>
                  <th>Contributing nutrients</th>
                  <th>RDI layer</th>
                  <th>Signal level</th>
                </tr>
              </thead>
              <tbody>
                {tableFoods.map((record: FoodRecord) => (
                  <tr key={record.id}>
                    <td>{record.rank}</td>
                    <td>{record.id}</td>
                    <td>{record.food}</td>
                    <td>{record.category}</td>
                    <td>{scoreFormatter(record.finalScore)}</td>
                    <td>{record.keyNutrients.join(", ")}</td>
                    <td>{record.rdiCheck}</td>
                    <td>{record.evidenceStrength}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tableFoods.length === 0 && (
              <div className="empty-state table-empty">
                <p>No foods match these filters.</p>
                <button type="button" onClick={resetFilters}>Reset</button>
              </div>
            )}
          </div>
        </section>
      </section>

      <section className="method-section" aria-labelledby="assumptions-title">
        <article>
          <div className="section-heading">
            <p className="eyebrow">Ranking assumptions</p>
            <h2 id="assumptions-title">Methodological Traceability</h2>
          </div>
          <dl className="assumption-list">
            {assumptions.map((item) => (
              <div key={item.term}>
                <dt>{item.term}</dt>
                <dd>{item.detail}</dd>
              </div>
            ))}
          </dl>
        </article>
        <article>
          <div className="section-heading">
            <p className="eyebrow">Limitations and future work</p>
            <h2>Interpretive Boundaries</h2>
          </div>
          <ul className="limitation-list">
            {limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}

export default App;
