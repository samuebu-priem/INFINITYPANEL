import { SupervisorLogData } from './parser.service';

export type ValidationIssue = {
  field: string;
  message: string;
};

export type SupervisorValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

type MatchRecord = {
  threadName?: string;
  game?: string;
  mode?: string;
  closedBy?: string;
  initialValue?: number;
  mediator?: string;
  mediatorId?: string;
  players?: string[];
  winner?: string;
  durationSeconds?: number;
  mediatorRevenue?: number;
  status?: string;
};

const normalize = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const isPositiveFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

export class ValidatorService {
  validate(log: SupervisorLogData, match: MatchRecord | null | undefined): SupervisorValidationResult {
    const issues: ValidationIssue[] = [];

    if (!log.players || log.players.length !== 2) {
      issues.push({ field: 'players', message: 'A aposta deve conter exatamente 2 jogadores.' });
    }

    if (!log.players.some((player: string) => normalize(player) === normalize(log.winner))) {
      issues.push({ field: 'winner', message: 'O vencedor não está listado entre os jogadores.' });
    }

    if (!log.mediatorName && !log.mediatorId) {
      issues.push({ field: 'mediator', message: 'Mediador ausente no log.' });
    }

    if (!Array.isArray(log.players) || log.players.length === 0) {
      issues.push({ field: 'players', message: 'Lista de jogadores ausente no log.' });
    }

    if (!log.threadName) {
      issues.push({ field: 'threadName', message: 'Thread ausente no log.' });
    }

    if (!log.game) {
      issues.push({ field: 'game', message: 'Jogo ausente no log.' });
    }

    if (!log.mode) {
      issues.push({ field: 'mode', message: 'Modalidade ausente no log.' });
    }

    if (!log.winner) {
      issues.push({ field: 'winner', message: 'Vencedor ausente no log.' });
    }

    if (!match) {
      issues.push({ field: 'match', message: 'Partida não encontrada na API.' });
      return { ok: issues.length === 0, issues };
    }

    if (normalize(match.threadName) !== normalize(log.threadName)) {
      issues.push({ field: 'threadName', message: 'Thread divergente entre Discord e backend.' });
    }

    if (normalize(match.game) !== normalize(log.game)) {
      issues.push({ field: 'game', message: 'Jogo divergente entre Discord e backend.' });
    }

    if (normalize(match.mode) !== normalize(log.mode)) {
      issues.push({ field: 'mode', message: 'Modalidade divergente entre Discord e backend.' });
    }

    if (normalize(match.mediator) !== normalize(log.mediatorName) && normalize(match.mediator) !== normalize(log.mediatorId)) {
      issues.push({ field: 'mediator', message: 'Mediador divergente entre Discord e backend.' });
    }

    if (Array.isArray(match.players) && log.players.length > 0) {
      const backendPlayers = match.players.map(normalize).sort();
      const discordPlayers = log.players.map(normalize).sort();
      if (backendPlayers.length !== discordPlayers.length || backendPlayers.some((player, index) => player !== discordPlayers[index])) {
        issues.push({ field: 'players', message: 'Lista de jogadores divergente.' });
      }
    }

    if (normalize(match.winner) !== normalize(log.winner)) {
      issues.push({ field: 'winner', message: 'Vencedor divergente entre Discord e backend.' });
    }

    if (isPositiveFiniteNumber(match.mediatorRevenue) && log.mediatorRevenue !== undefined && match.mediatorRevenue !== log.mediatorRevenue) {
      issues.push({ field: 'mediatorRevenue', message: 'Receita do mediador divergente.' });
    }

    if (match.status && normalize(match.status) !== 'completed' && normalize(match.status) !== 'concluded') {
      issues.push({ field: 'status', message: 'Status da partida está inconsistente.' });
    }

    return { ok: issues.length === 0, issues };
  }
}
