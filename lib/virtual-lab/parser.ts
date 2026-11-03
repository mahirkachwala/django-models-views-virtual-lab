import type { Field, Schema, Value } from './types';

export class LabError extends Error { constructor(public kind: string, message: string, public file = 'catalog/models.py', public line = 1) { super(message); } }

// A deliberately bounded grammar, never eval/exec. Strings and nested arguments
// are tokenized so commas, comments and parentheses inside literals are safe.
export function splitArgs(source: string): string[] {
  const parts: string[] = []; let part = ''; let depth = 0; let quote = ''; let escaped = false;
  for (const c of source) {
    if (quote) { part += c; if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === quote) quote = ''; }
    else if (c === '"' || c === "'") { quote = c; part += c; }
    else if ('([{'.includes(c)) { depth++; part += c; }
    else if (')]}'.includes(c)) { depth--; part += c; }
    else if (c === ',' && depth === 0) { parts.push(part.trim()); part = ''; }
    else part += c;
  }
  if (quote || depth !== 0) throw new LabError('SyntaxError', 'Unclosed string or bracket.');
  if (part.trim()) parts.push(part.trim()); return parts;
}
export function literal(value: string): Value {
  const v = value.trim();
  if (/^(['"])[\s\S]*\1$/.test(v)) return v.slice(1, -1).replace(/\\(['"\\])/g, '$1');
  if (v === 'True') return true; if (v === 'False') return false; if (v === 'None') return null;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (/^(models\.)?[A-Za-z_]\w*$/.test(v)) return v.replace(/^models\./, '');
  throw new LabError('UnsupportedSyntax', `Unsupported literal: ${v}. Use quoted text, numbers, True, False or None.`);
}
export function kwargs(source: string): Record<string, Value> {
  const result: Record<string, Value> = {};
  for (const arg of splitArgs(source)) { const m = arg.match(/^(\w+)\s*=\s*([\s\S]+)$/); if (!m) throw new LabError('SyntaxError', `Expected name=value, got ${arg}.`); result[m[1]] = literal(m[2]); }
  return result;
}
export function cleanCode(source: string): string {
  return source.split('\n').map(line => { let q = ''; let out = ''; let escape = false; for (const c of line) { if (!q && c === '#') break; out += c; if (escape) { escape = false; continue; } if (c === '\\') { escape = true; continue; } if (q && c === q) q = ''; else if (!q && (c === '"' || c === "'")) q = c; } return out; }).join('\n');
}
export function parseModels(source: string): Schema {
  const code = cleanCode(source); splitArgs(code); const schema: Schema = {};
  const classes = [...code.matchAll(/^class\s+(\w+)\(models\.Model\):\s*$/gm)];
  if (!classes.length) throw new LabError('SyntaxError', 'Define a class inheriting from models.Model.');
  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i]; const name = cls[1]; const body = code.slice(cls.index! + cls[0].length, classes[i + 1]?.index ?? code.length);
    const fields: Record<string, Field> = { id: { type: 'BigAutoField', options: { primary_key: true } } };
    const declarations = [...body.matchAll(/^\s+(\w+)\s*=\s*models\.(\w+)\s*\(([^]*?)\)(?=\s*(?:\n|$))/gm)];
    for (const d of declarations) {
      const line = code.slice(0, cls.index! + cls[0].length + d.index!).split('\n').length;
      const args = splitArgs(d[3]); const relation = ['ForeignKey', 'OneToOneField', 'ManyToManyField'].includes(d[2]);
      const target = relation && args[0] && !args[0].includes('=') ? String(literal(args.shift()!)) : undefined;
      const options = kwargs(args.join(','));
      const supported = ['CharField', 'TextField', 'IntegerField', 'PositiveIntegerField', 'DecimalField', 'BooleanField', 'DateField', 'DateTimeField', 'EmailField', 'SlugField', 'ForeignKey', 'OneToOneField', 'ManyToManyField'];
      if (!supported.includes(d[2])) throw new LabError('FieldError', `Unsupported field type ${d[2]}. See Runtime guide.`, 'catalog/models.py', line);
      if (d[2] === 'CharField' && !(Number(options.max_length) > 0)) throw new LabError('SystemCheckError', `${name}.${d[1]}: CharField requires positive max_length.`, 'catalog/models.py', line);
      if (d[2] === 'DecimalField' && (!(Number(options.max_digits) > 0) || !Number.isInteger(options.decimal_places) || Number(options.decimal_places) < 0 || Number(options.decimal_places) > Number(options.max_digits))) throw new LabError('SystemCheckError', `${name}.${d[1]}: supply max_digits and decimal_places (0 ≤ decimal_places ≤ max_digits).`, 'catalog/models.py', line);
      if (relation && !target) throw new LabError('SystemCheckError', `${d[1]} requires a target model.`, 'catalog/models.py', line);
      if (relation && d[2] !== 'ManyToManyField' && !['CASCADE', 'PROTECT', 'SET_NULL', 'RESTRICT'].includes(String(options.on_delete))) throw new LabError('SystemCheckError', `${d[1]} requires on_delete=models.CASCADE, PROTECT, RESTRICT or SET_NULL.`, 'catalog/models.py', line);
      if (options.on_delete === 'SET_NULL' && !options.null) throw new LabError('SystemCheckError', 'SET_NULL requires null=True.', 'catalog/models.py', line);
      fields[d[1]] = { type: d[2], options, ...(target ? { target } : {}) };
    }
    const fieldLines = body.split('\n').filter(l => /^\s+\w+\s*=\s*models\./.test(l));
    if (fieldLines.length !== declarations.length) throw new LabError('SyntaxError', `Invalid field declaration in ${name}; check parentheses and indentation.`);
    schema[name] = fields;
  }
  for (const [model, fields] of Object.entries(schema)) for (const [name, field] of Object.entries(fields)) if (field.target && !schema[field.target]) throw new LabError('SystemCheckError', `${model}.${name} references unknown model ${field.target}.`);
  return schema;
}
export const column = (name: string, f: Field) => f.target && f.type !== 'ManyToManyField' ? `${name}_id` : name;
export const schemaKey = (schema: Schema) => JSON.stringify(schema);
export function schemaDiff(before: Schema, after: Schema): string[] {
  const changes: string[] = [];
  for (const [m, fields] of Object.entries(after)) {
    if (!before[m]) changes.push(`Create model ${m}`);
    else { for (const [f, def] of Object.entries(fields)) { if (!before[m][f]) changes.push(`Add field ${m}.${f}`); else if (JSON.stringify(def) !== JSON.stringify(before[m][f])) changes.push(`Alter field ${m}.${f}`); }
      for (const f of Object.keys(before[m])) if (!fields[f]) changes.push(`Remove field ${m}.${f}`); }
  }
  for (const m of Object.keys(before)) if (!after[m]) changes.push(`Delete model ${m}`);
  return changes;
}
