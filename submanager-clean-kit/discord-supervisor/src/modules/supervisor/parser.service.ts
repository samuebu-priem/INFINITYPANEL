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
  if (typeof value !== 'string') return '';
  return value.replace(/\u00A0/g, ' ').trim();
};

const parseMoneyBRL = (value: string): number | undefined => {
  const normalized = normalizeText(value);
  const match = normalized.match(/R\$\s*([\d.,]+)/i);
  if (!match) return undefined;

  return Number(match[1].replace(/\./g, '').replace(',', '.'));
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

export class ParserService {
  parse(embed: Record<string, unknown>): SupervisorLogData | null {
    const description = normalizeText(embed.description);
    const rawFields = Array.isArray(embed.fields) ? (embed.fields as EmbedField[]) : [];
    const fields = rawFields.map((field) => ({
      name: normalizeText(field.name),
      value: normalizeText(field.value),
    }));

    const footer =
      embed.footer && typeof embed.footer === 'object'
        ? (embed.footer as Record<string, unknown>)
        : null;

    const footerText = normalizeText(footer?.text);
    const threadName =
      normalizeText(getFieldValue(fields, 'Thread')) ||
      normalizeText(getFieldValue(fields, 'Sala')) ||
      normalizeText(description.match(/thread[:\s]+([^\n`]+)/i)?.[1]) ||
      normalizeText(description.match(/([A-Za-z0-9_-]{6,})/i)?.[1]);
    const game =
      normalizeText(getFieldValue(fields, 'Jogo')) ||
      normalizeText(getFieldValue(fields, 'Game')) ||
      normalizeText(description.match(/jogo[:\s]+([^\n]+)/i)?.[1]);
    const mode =
      normalizeText(getFieldValue(fields, 'Modalidade')) ||
      normalizeText(getFieldValue(fields, 'Modo')) ||
      normalizeText(description.match(/modalidade[:\s]+([^\n]+)/i)?.[1]);

    const mediatorName =
      normalizeText(getFieldValue(fields, 'Mediador')) ||
      normalizeText(getFieldValue(fields, 'Mediator')) ||
      normalizeText(getFieldValue(fields, 'Administrador'));
    const mediatorId =
      extractFirstNumber(getFieldValue(fields, 'ID do Mediador')) ||
      extractFirstNumber(getFieldValue(fields, 'Mediador ID')) ||
      extractFirstNumber(footerText) ||
      extractFirstNumber(description);
    const winnerValue = getFieldValue(fields, 'Vencedor') || getFieldValue(fields, 'Winner');
    const winnerId = extractFirstNumber(winnerValue) || extractFirstNumber(description);
    const playerMentions = extractMentionIds(description);
    const mediatorRevenueField = getFieldValue(fields, 'Receita do Mediador') || getFieldValue(fields, 'Lucro do Mediador');

    if (!threadName || !game || !mode || !mediatorName || !mediatorId || !winnerId) {
      return null;
    }

    return {
      players: playerMentions,
      threadName,
      game,
      mode,
      mediatorName,
      mediatorId,
      winner: winnerId,
      mediatorRevenue: mediatorRevenueField ? parseMoneyBRL(mediatorRevenueField) : undefined,
    };
  }
}
