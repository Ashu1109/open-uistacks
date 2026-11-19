import type { ReactNode } from "react";
import { useDemoView } from "../demo";
import { ForecastChart } from "../../originals/ui/forecast-chart";
import { ActivityHeatmap } from "../../originals/ui/activity-heatmap";
import { Treemap } from "../../originals/ui/treemap";
import { BulletChart } from "../../originals/ui/bullet-chart";
import { Candlestick } from "../../originals/ui/candlestick";
import { ScatterPlot } from "../../originals/ui/scatter-plot";
import { WaffleChart } from "../../originals/ui/waffle-chart";
import { DotGlobe } from "../../originals/ui/dot-globe";
import { DotMap } from "../../originals/ui/dot-map";
import { ThresholdGauge } from "../../originals/ui/threshold-gauge";
import { PortfolioChart } from "../../originals/ui/portfolio-chart";
import { SinceLastVisit } from "../../originals/ui/since-last-visit";
import { UptimeBars, type UptimeDay } from "../../originals/ui/uptime-bars";
import { FunnelChart } from "../../originals/ui/funnel-chart";
import { RadarChart } from "../../originals/ui/radar-chart";
import { StackedArea } from "../../originals/ui/stacked-area";
import { HourHeatmap } from "../../originals/ui/hour-heatmap";
import { WaterfallChart } from "../../originals/ui/waterfall-chart";
import { SankeyChart } from "../../originals/ui/sankey-chart";
import { AnnotatedLine } from "../../originals/ui/annotated-line";
import { BoxPlot } from "../../originals/ui/box-plot";
import { MultiLine } from "../../originals/ui/multi-line";

function Demo({ title, slug, children }: { title: string; slug: string; children: ReactNode }) {
  const view = useDemoView(slug);
  if (view === "hidden") return null;
  if (view === "bare") return <div data-demo className="col-span-full w-full min-w-0">{children}</div>;
  return (
    <section id={slug} className="grid gap-3">
      <h3 className="text-sm font-medium text-fg-muted">{title}</h3>
      <div className="rounded-[20px] bg-subtle/50 p-6">{children}</div>
    </section>
  );
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rand = seeded(7);
const walk = (n: number, start: number, step: number) => {
  let v = start;
  return Array.from({ length: n }, () => (v += (rand() - 0.42) * step));
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const activity = Array.from({ length: 182 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 5, 30) - (181 - i) * 86_400_000);
  return { date: d.toISOString().slice(0, 10), count: rand() < 0.25 ? 0 : Math.floor(rand() * 12) };
});
const actual = walk(10, 120, 18);
const last = actual[actual.length - 1];
const forecast = Array.from({ length: 6 }, (_, i) => last + (i + 1) * 9);
const candles = (() => {
  let price = 100;
  return Array.from({ length: 24 }, (_, i) => {
    const open = price;
    const close = open + (rand() - 0.47) * 8;
    price = close;
    return { label: `D${i + 1}`, open, close, high: Math.max(open, close) + rand() * 4, low: Math.min(open, close) - rand() * 4 };
  });
})();
const scatter = Array.from({ length: 60 }, (_, i) => {
  const group = ["Small", "Medium", "Large"][i % 3];
  const x = 10 + rand() * 80;
  return { x, y: x * (0.5 + (i % 3) * 0.3) + rand() * 20, group, label: `${group} ${i + 1}` };
});
const uptime: UptimeDay[] = Array.from({ length: 60 }, (_, i) => ({
  date: `Day ${i + 1}`,
  status: i === 22 ? "down" : i === 41 || i === 42 ? "degraded" : i < 3 ? "none" : "up",
  note: i === 22 ? "Database failover" : undefined,
}));
const heat = Array.from({ length: 7 }, (_, d) => Array.from({ length: 24 }, (_, h) => Math.round(Math.max(0, Math.sin(((h - 6) / 24) * Math.PI * 2) * 40 + 45 - (d > 4 ? 25 : 0) + rand() * 15))));

export function Section() {
  return (
    <div className="grid gap-10">
      <Demo title="Forecast chart" slug="forecast-chart">
        <ForecastChart actual={actual} forecast={forecast} band={forecast.map((v, i): [number, number] => [v - 6 - i * 3, v + 6 + i * 3])} labels={Array.from({ length: 16 }, (_, i) => `W${i + 1}`)} />
      </Demo>
      <Demo title="Activity heatmap" slug="activity-heatmap">
        <ActivityHeatmap data={activity} weeks={26} unit="events" />
      </Demo>
      <Demo title="Treemap" slug="treemap">
        <Treemap items={[{ label: "Compute", value: 420 }, { label: "Storage", value: 260 }, { label: "Network", value: 180 }, { label: "Databases", value: 150 }, { label: "Monitoring", value: 70 }, { label: "Support", value: 55 }, { label: "Other", value: 30 }]} format={(n) => `$${n}`} />
      </Demo>
      <Demo title="Bullet chart" slug="bullet-chart">
        <BulletChart rows={[{ label: "Revenue", value: 270, target: 250, ranges: [150, 225, 300] }, { label: "Profit", value: 22, target: 26, ranges: [15, 22, 30] }, { label: "New customers", value: 1380, target: 1700, ranges: [1000, 1500, 2000] }, { label: "Satisfaction", value: 4.4, target: 4.5, ranges: [3.5, 4.2, 5] }]} />
      </Demo>
      <Demo title="Candlestick" slug="candlestick">
        <Candlestick data={candles} format={(n) => n.toFixed(0)} />
      </Demo>
      <Demo title="Scatter plot" slug="scatter-plot">
        <ScatterPlot points={scatter} xLabel="Requests per minute" yLabel="Latency (ms)" />
      </Demo>
      <Demo title="Waffle chart" slug="waffle-chart">
        <WaffleChart segments={[{ label: "Direct", value: 46 }, { label: "Search", value: 28 }, { label: "Referral", value: 17 }, { label: "Social", value: 9 }]} />
      </Demo>
      <Demo title="Dot globe" slug="dot-globe">
        <div className="flex justify-center"><DotGlobe size={320} markers={[{ label: "Frankfurt", lat: 50.1, lon: 8.7 }, { label: "Singapore", lat: 1.3, lon: 103.8 }, { label: "Virginia", lat: 38.9, lon: -77.4 }, { label: "Sao Paulo", lat: -23.5, lon: -46.6 }]} /></div>
      </Demo>
      <Demo title="Dot map" slug="dot-map">
        <DotMap locations={[{ label: "Frankfurt", lat: 50.1, lon: 8.7, value: 4200 }, { label: "Singapore", lat: 1.3, lon: 103.8, value: 2900 }, { label: "Virginia", lat: 38.9, lon: -77.4, value: 6100 }, { label: "Sydney", lat: -33.9, lon: 151.2, value: 1500 }, { label: "Sao Paulo", lat: -23.5, lon: -46.6, value: 1900 }]} format={(n) => `${n} users`} />
      </Demo>
      <Demo title="Threshold gauge" slug="threshold-gauge">
        <div className="flex flex-wrap justify-around gap-6">
          <ThresholdGauge value={38} label="Memory" unit="%" />
          <ThresholdGauge value={72} label="CPU load" unit="%" />
          <ThresholdGauge value={94} label="Disk usage" unit="%" />
        </div>
      </Demo>
      <Demo title="Portfolio chart" slug="portfolio-chart">
        <PortfolioChart ranges={[
          { id: "1w", label: "1W", values: walk(7, 24000, 500), labels: WEEK },
          { id: "1m", label: "1M", values: walk(30, 23000, 600), labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`) },
          { id: "1y", label: "1Y", values: walk(12, 19000, 1200), labels: MONTHS },
        ]} />
      </Demo>
      <Demo title="Since last visit" slug="since-last-visit">
        <SinceLastVisit since="3 days ago" visitIndex={4} metrics={[
          { id: "sessions", label: "Sessions", values: [820, 860, 910, 880, 900, 980, 1040, 1120] },
          { id: "errors", label: "Error rate", values: [2.1, 2.4, 2.2, 2.6, 2.5, 1.9, 1.6, 1.4], lowerIsBetter: true, format: (n) => `${n.toFixed(1)}%` },
          { id: "latency", label: "p95 latency", values: [310, 305, 300, 312, 308, 340, 360, 395], lowerIsBetter: true, format: (n) => `${n} ms` },
          { id: "seats", label: "Active seats", values: [48, 48, 48, 48, 48, 48, 48, 48] },
        ]} />
      </Demo>
      <Demo title="Uptime bars" slug="uptime-bars">
        <UptimeBars days={uptime} name="API" />
      </Demo>
      <Demo title="Funnel chart" slug="funnel-chart">
        <FunnelChart stages={[{ label: "Visited", value: 12400 }, { label: "Signed up", value: 5200 }, { label: "Activated", value: 3100 }, { label: "Subscribed", value: 1250 }, { label: "Retained", value: 880 }]} />
      </Demo>
      <Demo title="Radar chart" slug="radar-chart">
        <RadarChart axes={["Speed", "Accuracy", "Cost", "Context", "Safety", "Tooling"]} max={10} series={[{ name: "Model A", values: [8, 7, 5, 9, 8, 6] }, { name: "Model B", values: [6, 9, 8, 5, 7, 8] }]} />
      </Demo>
      <Demo title="Stacked area" slug="stacked-area">
        <StackedArea labels={MONTHS} series={[{ name: "Web", values: [30, 34, 38, 42, 40, 46, 52, 55, 58, 60, 66, 70] }, { name: "Mobile", values: [18, 20, 24, 28, 33, 36, 40, 46, 50, 56, 60, 68] }, { name: "API", values: [10, 12, 12, 15, 18, 20, 24, 26, 30, 34, 38, 44] }]} />
      </Demo>
      <Demo title="Hour heatmap" slug="hour-heatmap">
        <HourHeatmap values={heat} unit="requests" />
      </Demo>
      <Demo title="Waterfall chart" slug="waterfall-chart">
        <WaterfallChart steps={[{ label: "Opening", value: 500, total: true }, { label: "New sales", value: 220 }, { label: "Upgrades", value: 90 }, { label: "Churn", value: -130 }, { label: "Refunds", value: -45 }, { label: "Closing", value: 0, total: true }]} format={(n) => `$${n}`} />
      </Demo>
      <Demo title="Sankey chart" slug="sankey-chart">
        <SankeyChart
          nodes={[{ id: "visits", label: "Visits" }, { id: "docs", label: "Docs" }, { id: "pricing", label: "Pricing" }, { id: "signup", label: "Sign up" }, { id: "leave", label: "Left" }, { id: "paid", label: "Paid" }, { id: "free", label: "Free" }]}
          links={[{ source: "visits", target: "docs", value: 520 }, { source: "visits", target: "pricing", value: 380 }, { source: "docs", target: "signup", value: 210 }, { source: "docs", target: "leave", value: 310 }, { source: "pricing", target: "signup", value: 190 }, { source: "pricing", target: "leave", value: 190 }, { source: "signup", target: "paid", value: 120 }, { source: "signup", target: "free", value: 280 }]}
        />
      </Demo>
      <Demo title="Annotated line" slug="annotated-line">
        <AnnotatedLine labels={Array.from({ length: 14 }, (_, i) => `Mar ${i + 1}`)} values={[210, 224, 218, 240, 236, 120, 150, 230, 260, 275, 270, 310, 330, 325]} annotations={[{ index: 3, title: "Release 4.2", note: "Faster search shipped", tone: "success" }, { index: 5, title: "Outage", note: "Region failover, 38 minutes", tone: "danger" }, { index: 11, title: "Campaign", note: "Email launch", tone: "info" }]} />
      </Demo>
      <Demo title="Box plot" slug="box-plot">
        <BoxPlot groups={[
          { label: "Small", values: [42, 48, 51, 53, 55, 58, 60, 62, 66, 70, 140] },
          { label: "Medium", values: [55, 60, 64, 66, 70, 72, 75, 79, 84, 88] },
          { label: "Large", values: [70, 78, 82, 90, 95, 99, 104, 110, 118, 125, 20] },
          { label: "XL", values: [88, 96, 101, 108, 112, 120, 127, 133, 140, 150] },
        ]} format={(n) => `${n} ms`} />
      </Demo>
      <Demo title="Multi line" slug="multi-line">
        <MultiLine smooth labels={MONTHS} series={[{ name: "Requests", values: [40, 46, 52, 49, 60, 66, 72, 70, 82, 90, 96, 104] }, { name: "Cache hits", values: [22, 30, 34, 38, 45, 50, 56, 60, 66, 74, 80, 88] }, { name: "Errors", values: [6, 5, 7, 4, 6, 3, 4, 5, 3, 2, 3, 2] }]} />
      </Demo>
    </div>
  );
}
