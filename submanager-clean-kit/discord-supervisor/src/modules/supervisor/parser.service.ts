export type SupervisorLogData = {
  threadName: string;
  game: string;
  mode: string;
  closedBy: string;
  initialValue: number;
  mediator: string;
  mediatorId: string;
  players: string[];
  winner: string;
  durationSeconds: number;
  mediatorRevenue: number | null;
};

type AnyRecord = Record<string, unknown>;

const cleanText = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/\u200b/g, '').trim() : '';

const parseCurrencyBRL = (value: unknown): number | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const raw = String(value).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDurationSeconds = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.trunc(value));
  if (typeof value !== 'string') return null;
  const input = value.trim().toLowerCase();
  const m = input.match(/^(?:(\d+)\s*h\s*)?(?:(\d+)\s*m\s*)?(?:(\d+)\s*s\s*)?$/i);
  if (!m) {
    const directSeconds = Number(input.replace(/[^\d]/g, ''));
    return Number.isFinite(directSeconds) ? directSeconds : null;
  }
  const hours = Number(m[1] ?? 0);
  const minutes = Number(m[2] ?? 0);
  const seconds = Number(m[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
};

const getValueFromField = (fields: AnyRecord[], nameMatchers: RegExp[]): string => {
  for (const field of fields) {
    const name = cleanText(field.name);
    const value = cleanText(field.value);
    if (!name || !value) continue;
    if (nameMatchers.some((matcher) => matcher.test(name))) return value;
  }
  return '';
};

const extractFromDescription = (description: string, label: string): string => {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = description.match(new RegExp(`^${escapedLabel}\\s*:?\\s*(.+)$`, 'im'));
  return (match?.[1] ?? '').trim();
};

const extractFooterText = (embed: AnyRecord): string => {
  const footer = embed.footer as AnyRecord | undefined;
  return cleanText(footer?.text);
};

const extractMediatorId = (embed: AnyRecord, description: string): string => {
  const footerText = extractFooterText(embed);
  const footerMatch = footerText.match(/(?:id\s*do\s*mediador|mediator\s*id|id)\s*[:#-]?\s*([\w-]+)/i);
  if (footerMatch?.[1]) return footerMatch[1].trim();

  const descriptionMatch = description.match(/(?:id\s*do\s*mediador|mediator\s*id|id)\s*[:#-]?\s*([\w-]+)/i);
  return (descriptionMatch?.[1] ?? '').trim();
};

const extractPrimaryValueLine = (description: string): string => {
  const match = description.match(/^Valor\s*:?\s*(.+)$/im);
  return (match?.[1] ?? '').trim();
};

const extractListFromValue = (value: string): string[] =>
  value
    .split(/[,\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);

export class ParserService {
  parse(embed: AnyRecord): SupervisorLogData | null {
    const title = cleanText(embed.title);
    if (!/^🏆?\s*Aposta Concluída/i.test(title)) return null;

    const fields = Array.isArray(embed.fields) ? (embed.fields as AnyRecord[]) : [];
    const description = cleanText(embed.description);

    const threadName =
      getValueFromField(fields, [/^thread$/i, /^thread name$/i]) ||
      extractFromDescription(description, 'Thread');
    const game =
      getValueFromField(fields, [/^jogo$/i, /^game$/i]) ||
      extractFromDescription(description, 'Jogo');
    const mode =
      getValueFromField(fields, [/^modalidade$/i, /^mode$/i]) ||
      extractFromDescription(description, 'Modalidade');
    const mediator =
      getValueFromField(fields, [/^mediador$/i, /^mediator$/i]) ||
      extractFromDescription(description, 'Mediador');
    const playersRaw =
      getValueFromField(fields, [/^jogadores$/i, /^players$/i]) ||
      extractFromDescription(description, 'Jogadores');
    const players = extractListFromValue(playersRaw);
    const winner =
      getValueFromField(fields, [/^partidas$/i, /^winner$/i, /^vencedor$/i]) ||
      extractFromDescription(description, 'Partidas') ||
      extractFromDescription(description, 'Vencedor');
    const mediatorRevenue =
      parseCurrencyBRL(getValueFromField(fields, [/^receita do mediador$/i, /^mediator revenue$/i])) ??
      parseCurrencyBRL(extractFromDescription(description, 'Receita do Mediador'));
    const mediatorId = extractMediatorId(embed, description);

    if (!threadName || !game || !mode || !mediator || !winner || !mediatorId) {
      return null;
    }

    return {
      threadName,
      game,
      mode,
      closedBy: '',
      initialValue: parseCurrencyBRL(extractPrimaryValueLine(description)) ?? 0,
      mediator,
      mediatorId,
      players,
      winner,
      durationSeconds: parseDurationSeconds(extractFromDescription(description, 'Duração Total')) ?? 0,
      mediatorRevenue
    };
  }
}