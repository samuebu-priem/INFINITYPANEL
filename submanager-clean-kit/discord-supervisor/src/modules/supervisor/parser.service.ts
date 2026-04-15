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

    const rawThreadName =
      normalizeText(getFieldValue(fields, 'Thread')) ||
      normalizeText(getFieldValue(fields, 'Sala')) ||
      normalizeText(description.match(/thread[:\s]+([^\n`]+)/i)?.[1]) ||
      normalizeText(description.match(/(fila-[^\n`]+)/i)?.[1]);

    const threadName = rawThreadName
      .replace(/^\*+\s*/, '')
      .replace(/\s*\*+$/, '')
      .trim();

    const game =
      normalizeText(getFieldValue(fields, 'Jogo')) ||
      normalizeText(getFieldValue(fields, 'Game')) ||
      normalizeText(description.match(/jogo[:\s]+([^\n]+)/i)?.[1]);

    const mode =
      normalizeText(getFieldValue(fields, 'Modalidade')) ||
      normalizeText(getFieldValue(fields, 'Modo')) ||
      normalizeText(description.match(/modalidade[:\s]+([^\n]+)/i)?.[1]);

    const mediatorField =
      getFieldValue(fields, 'Mediador') ||
      getFieldValue(fields, 'Mediator') ||
      getFieldValue(fields, 'Administrador');

    const mediatorName =
      normalizeText(mediatorField) ||
      normalizeText(description.match(/mediador[:\s]+([^\n]+)/i)?.[1]);

    const mediatorId =
      extractFirstNumber(getFieldValue(fields, 'ID do Mediador')) ||
      extractFirstNumber(getFieldValue(fields, 'Mediador ID')) ||
      extractFirstNumber(mediatorField) ||
      extractFirstNumber(footerText);

    const winnerValue =
      getFieldValue(fields, 'Vencedor') ||
      getFieldValue(fields, 'Winner') ||
      description.match(/vencedor[:\s]+([^\n]+)/i)?.[1] ||
      '';

    const winner = extractFirstNumber(winnerValue) || extractFirstNumber(description);

    const playersField =
      getFieldValue(fields, 'Jogadores') ||
      getFieldValue(fields, 'Players') ||
      getFieldValue(fields, 'Participantes');

    const players = playersField ? extractMentionIds(playersField) : [];

    const mediatorRevenueField =
      getFieldValue(fields, 'Receita do Mediador') ||
      getFieldValue(fields, 'Lucro do Mediador') ||
      getFieldValue(fields, 'Lucro');

    if (!threadName || !game || !mode || !mediatorName || !mediatorId || !winner) {
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