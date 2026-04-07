export type SupervisorLogData = {
  players: any;
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

    const threadMatch = description.match(/\*\*Thread:\*\*\s*([^\n`]+)/i);
    const gameMatch = description.match(/\*\*Jogo:\*\*\s*([^\n]+)/i);
    const modeMatch = description.match(/\*\*Modalidade:\*\*\s*([^\n]+)/i);

    const mediatorName = getFieldValue(fields, 'Mediador');
    const partidasField = getFieldValue(fields, 'Partidas');
    const mediatorRevenueField = getFieldValue(fields, 'Receita do Mediador');

    const mediatorIdMatch = footerText.match(/ID do Mediador:\s*(\d+)/i);
    const winnerMatch = partidasField.match(/\*\*Vencedor:\*\*\s*<@(\d+)>/i);

    if (
      !threadMatch ||
      !gameMatch ||
      !modeMatch ||
      !mediatorName ||
      !mediatorIdMatch ||
      !winnerMatch
    ) {
      return null;
    }

    return {
      players: [], // TODO: Extract players data from embed
      threadName: normalizeText(threadMatch[1]),
      game: normalizeText(gameMatch[1]),
      mode: normalizeText(modeMatch[1]),
      mediatorName,
      mediatorId: normalizeText(mediatorIdMatch[1]),
      winner: normalizeText(winnerMatch[1]),
      mediatorRevenue: mediatorRevenueField
        ? parseMoneyBRL(mediatorRevenueField)
        : undefined,
    };
  }
}