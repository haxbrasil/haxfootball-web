export type JsonValue =
  | boolean
  | null
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };
export type VisualizationRow = JsonObject;
export type VisualizationSpecification = {
  datasets: Array<{ id: string; source: string; operations?: JsonObject[] }>;
  option: JsonObject;
  chart?: {
    type:
      | "bar"
      | "line"
      | "area"
      | "scatter"
      | "bubble"
      | "pie"
      | "donut"
      | "radar"
      | "heatmap"
      | "boxplot"
      | "funnel"
      | "gauge"
      | "treemap"
      | "sunburst"
      | "sankey"
      | "graph"
      | "tree"
      | "parallel"
      | "calendar";
    datasetId: string;
    fields: Record<string, string | string[]>;
    settings?: JsonObject;
  };
  interactions?: JsonObject;
  accessibility?: { summary?: string; table?: boolean };
};
export type RenderedVisualization = {
  id: string;
  title: string;
  description?: string | null;
  option: JsonObject;
  datasets: Array<{ id: string; rows: VisualizationRow[] }>;
  accessibility?: { summary?: string; table?: boolean };
  layout?: { width: "compact" | "half" | "full"; height: "short" | "medium" | "tall" | "viewport" };
  renderError?: string;
};
export type VisualizationDashboard = { items: RenderedVisualization[] };
