export type SupervisorLogData = {
  players: string[];
  threadName: string;
  game: string;
  mode: string;
  winner: string;
  mediatorId: string;
  mediatorName: string;
  mediatorRevenue?: number;
};

type EmbedField = {
  name?: string;
  value?: string;
};

const normalizeText = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.replace(/\u00A0/g, " ").trim();
};

const cleanMarkdownLabelValue = (value: string): string => {
  return normalizeText(value)
    .replace(/^\*\*+\s*/, "")
    .replace(/\s*\*\*+$/, "")
    .trim();
};

const parseMoneyBRL = (value: string): number | undefined => {
  const normalized = normalizeText(value);
  const match = normalized.match(/R\$\s*([\d.,]+)/i);
  if (!match) return undefined;

  return Number(match[1].replace(/\./g, "").replace(",", "."));
};

const getFieldValue = (fields: EmbedField[], fieldName: string): string => {
  const field = fields.find(
    (item) => normalizeText(item.name).toLowerCase() === fieldName.toLowerCase()
  );

  return normalizeText(field?.value);
};

const extractMentionIds = (value: string): string[] =>
  Array.from(value.matchAll(/<@!?(\d+)>/g)).map((match) => normalizeText(match[1]));

const extractFirstNumber = (value: string): string | undefined => {
  const match = normalizeText(value).match(/(\d{5,})/);
  return match?.[1];
};

const extractWinnerFromMatchBlock = (value: string): string | undefined => {
  const normalized = normalizeText(value);

  const mentionMatch = normalized.match(/\*\*Vencedor:\*\*\s*<@!?(\d+)>/i);
  if (mentionMatch?.[1]) return normalizeText(mentionMatch[1]);

  const numericMatch = normalized.match(/\*\*Vencedor:\*\*\s*.*?\((\d{5,})\)/i);
  if (numericMatch?.[1]) return normalizeText(numericMatch[1]);

  return undefined;
};

export class ParserService {
  parse(embed: Record<string, unknown>): SupervisorLogData | null {
    const description = normalizeText(embed.description);
    const rawFields = Array.isArray(embed.fields) ? (embed.fields as EmbedField[]) : [];
    const fields = rawFields.map((field) => ({
      name: normalizeText(field.name),
      value: normalizeText(field.value),
    }));

    const footer =
      embed.footer && typeof embed.footer === "object"
        ? (embed.footer as Record<string, unknown>)
        : null;

    const footerText = normalizeText(footer?.text);

    const rawThreadName =
      getFieldValue(fields, "Thread") ||
      getFieldValue(fields, "Sala") ||
      normalizeText(description.match(/\*\*Thread:\*\*\s*([^\n`]+)/i)?.[1]) ||
      normalizeText(description.match(/thread[:\s]+([^\n`]+)/i)?.[1]) ||
      normalizeText(description.match(/(fila-[^\n`]+)/i)?.[1]);

    const threadName = cleanMarkdownLabelValue(rawThreadName);

    const rawGame =
      getFieldValue(fields, "Jogo") ||
      getFieldValue(fields, "Game") ||
      normalizeText(description.match(/\*\*Jogo:\*\*\s*([^\n]+)/i)?.[1]) ||
      normalizeText(description.match(/jogo[:\s]+([^\n]+)/i)?.[1]);

    const game = cleanMarkdownLabelValue(rawGame);

    const rawMode =
      getFieldValue(fields, "Modalidade") ||
      getFieldValue(fields, "Modo") ||
      normalizeText(description.match(/\*\*Modalidade:\*\*\s*([^\n]+)/i)?.[1]) ||
      normalizeText(description.match(/modalidade[:\s]+([^\n]+)/i)?.[1]);

    const mode = cleanMarkdownLabelValue(rawMode);

    const mediatorField =
      getFieldValue(fields, "Mediador") ||
      getFieldValue(fields, "Mediator") ||
      getFieldValue(fields, "Administrador");

    const mediatorName =
      normalizeText(mediatorField) ||
      normalizeText(description.match(/mediador[:\s]+([^\n]+)/i)?.[1]);

    const mediatorId =
      extractFirstNumber(getFieldValue(fields, "ID do Mediador")) ||
      extractFirstNumber(getFieldValue(fields, "Mediador ID")) ||
      extractFirstNumber(mediatorField) ||
      extractFirstNumber(footerText);

    const winnerField =
      getFieldValue(fields, "Vencedor") ||
      getFieldValue(fields, "Winner") ||
      getFieldValue(fields, "Ganhador") ||
      getFieldValue(fields, "Resultado");

    const matchBlock =
      getFieldValue(fields, "Partidas") ||
      getFieldValue(fields, "Partida");

    const winnerMentionIds = extractMentionIds(winnerField);
    const winner =
      winnerMentionIds[0] ||
      extractFirstNumber(winnerField) ||
      extractWinnerFromMatchBlock(matchBlock);

    const playersField =
      getFieldValue(fields, "Jogadores") ||
      getFieldValue(fields, "Players") ||
      getFieldValue(fields, "Participantes");

    const players = playersField ? extractMentionIds(playersField) : [];

    const mediatorRevenueField =
      getFieldValue(fields, "Receita do Mediador") ||
      getFieldValue(fields, "Lucro do Mediador") ||
      getFieldValue(fields, "Lucro");

    if (!threadName || !game || !mode || !mediatorName || !mediatorId || !winner) {
      console.log("parser falhou - campos extraídos:", {
        threadName,
        game,
        mode,
        mediatorName,
        mediatorId,
        winner,
        winnerField,
        matchBlock,
        fields,
        description,
        footerText,
      });
      return null;
    }

    return {
      players,
      threadName,
      game,
      mode,
      mediatorName,
      mediatorId,
      winner,
      mediatorRevenue: mediatorRevenueField ? parseMoneyBRL(mediatorRevenueField) : undefined,
    };
  }
}