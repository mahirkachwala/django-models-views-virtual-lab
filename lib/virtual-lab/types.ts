export type Value = string | number | boolean | null;
export type Row = Record<string, Value>;
export type Field = { type: string; options: Record<string, Value>; target?: string };
export type Schema = Record<string, Record<string, Field>>;
export type Migration = { name: string; schema: Schema; changes: string[]; applied: boolean; source: string };
export type Trace = { stage: string; detail: string };
export type Response = { status: number; html: string; template?: string; context: Record<string, unknown>; view?: string; route?: string; contentType: string; queries: number; trace: Trace[]; error?: string; location?: string };
export type Request = { method: string; path: string; post: Record<string, string>; user: string; query: Record<string, string> };
export type LabState = {
  version: 1; experimentId: number; files: Record<string, string>; drafts: Record<string, string>;
  schema: Schema; migrations: Migration[]; tables: Record<string, Row[]>;
  variables: Record<string, { model: string; row: Row }>; shell: boolean; server: boolean;
  terminal: string[]; sql: string; result: unknown; request?: Request; response?: Response;
  navigation: string[]; navigationIndex: number; user: string; csrf: boolean;
  evidence: Record<string, number>; log: { time: string; action: string; observation: string }[];
  hints: number; observation: string; verifiedSchema: string; attempts: number;
};
export type Question = { prompt: string; options: string[]; answer: number; explanation: string };
export type Topic = { title: string; text: string; code?: string };
export type Experiment = {
  id: number; title: string; aim: string; task: string; duration: string;
  files: Record<string, string>; activeFile: string; objectives: { id: string; label: string }[];
  hints: string[]; theory: Topic[]; procedure: string[]; references: { title: string; url: string }[];
  pretest: Question[]; posttest: Question[]; panels: string[];
};
