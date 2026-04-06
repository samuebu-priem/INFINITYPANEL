export type SupervisorLogData = {
  threadName: string;
  game: string;
  mode: string;
  closedBy: string;
  initialValue: number;
  mediator: string;
  players: string[];
  winner: string;
  durationSeconds: number;
  mediatorRevenue: number;
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

export class ParserService {
  parse(embed: AnyRecord): SupervisorLogData | null {
    const title = cleanText(embed.title);
    if (!/^🏆?\s*Aposta Concluída/i.test(title)) return null;

    const fields = Array.isArray(embed.fields) ? embed.fields as AnyRecord[] : [];
    const description = cleanText(embed.description);

    const threadName =
      getValueFromField(fields, [/^thread$/i, /^thread name$/i]) ||
      (description.match(/Thread:\s*([^\n]+)/i)?.[1] ?? '').trim();

    const game =
      getValueFromField(fields, [/^jogo$/i, /^game$/i]) ||
      (description.match(/Jogo:\s*([^\n]+)/i)?.[1] ?? '').trim();

    const mode =
      getValueFromField(fields, [/^modalidade$/i, /^mode$/i]) ||
      (description.match(/Modalidade:\s*([^\n]+)/i)?.[1] ?? '').trim();

    const closedBy =
      getValueFromField(fields, [/^encerrado por$/i, /^closed by$/i]) ||
      (description.match(/Encerrado por:\s*([^\n]+)/i)?.[1] ?? '').trim();

    const initialValue =
      parseCurrencyBRL(getValueFromField(fields, [/^valor inicial$/i, /^initial value$/i])) ??
      parseCurrencyBRL(description.match(/Valor Inicial:\s*([^\n]+)/i)?.[1] ?? '');

    const mediator =
      getValueFromField(fields, [/^mediador$/i, /^mediator$/i]) ||
      (description.match(/Mediador:\s*([^\n]+)/i)?.[1] ?? '').trim();

    const playersBlock =
      getValueFromField(fields, [/^jogadores$/i, /^players$/i]) ||
      (description.match(/Jogadores:\s*([\s\S]*?)(?:\n\s*Partidas:|\n\s*Duração Total:|$)/i)?.[1] ?? '');

    const players = playersBlock
      .split('\n')
      .map((line) => line.replace(/^[*\-\d.\s]+/, '').trim())
      .filter(Boolean);

    const winner =
      getValueFromField(fields, [/^vencedor$/i, /^winner$/i]) ||
      (description.match(/Vencedor:\s*([^\n]+)/i)?.[1] ?? '').trim();

    const durationSeconds =
      parseDurationSeconds(getValueFromField(fields, [/^duração total$/i, /^duration$/i])) ??
      parseDurationSeconds(description.match(/Duração Total:\s*([^\n]+)/i)?.[1] ?? '');

    const mediatorRevenue =
      parseCurrencyBRL(getValueFromField(fields, [/^receita do mediador$/i, /^mediator revenue$/i])) ??
      parseCurrencyBRL(description.match(/Receita do Mediador:\s*([^\n]+)/i)?.[1] ?? '');

    if (
      !threadName ||
      !game ||
      !mode ||
      !closedBy ||
      initialValue === null ||
      !mediator ||
      !winner ||
      durationSeconds === null ||
      mediatorRevenue === null
    ) {
      return null;
    }

    return {
      threadName,
      game,
      mode,
      closedBy,
      initialValue,
      mediator,
      players,
      winner,
      durationSeconds,
      mediatorRevenue
    };
  }
}
