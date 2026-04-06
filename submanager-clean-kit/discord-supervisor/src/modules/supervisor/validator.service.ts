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

    if (!log.players.some((player) => normalize(player) === normalize(log.winner))) {
      issues.push({ field: 'winner', message: 'O vencedor não está listado entre os jogadores.' });
    }

    if (!log.mediator) {
      issues.push({ field: 'mediator', message: 'Mediador ausente no log.' });
    }

    if (!isPositiveFiniteNumber(log.initialValue) || log.initialValue <= 0) {
      issues.push({ field: 'initialValue', message: 'Valor inicial inválido.' });
    }

    if (!isPositiveFiniteNumber(log.durationSeconds) || log.durationSeconds <= 0 || log.durationSeconds > 60 * 60 * 24) {
      issues.push({ field: 'duration', message: 'Duração total fora do intervalo esperado.' });
    }

    if (!isPositiveFiniteNumber(log.mediatorRevenue) && log.mediatorRevenue !== 0) {
      issues.push({ field: 'mediatorRevenue', message: 'Receita do mediador inválida.' });
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

    if (normalize(match.closedBy) !== normalize(log.closedBy)) {
      issues.push({ field: 'closedBy', message: 'Campo "encerrado por" divergente.' });
    }

    if (isPositiveFiniteNumber(match.initialValue) && match.initialValue !== log.initialValue) {
      issues.push({ field: 'initialValue', message: 'Valor inicial divergente entre Discord e backend.' });
    }

    if (normalize(match.mediator) !== normalize(log.mediator)) {
      issues.push({ field: 'mediator', message: 'Mediador divergente entre Discord e backend.' });
    }

    if (Array.isArray(match.players)) {
      const backendPlayers = match.players.map(normalize).sort();
      const discordPlayers = log.players.map(normalize).sort();
      if (backendPlayers.length !== discordPlayers.length || backendPlayers.some((player, index) => player !== discordPlayers[index])) {
        issues.push({ field: 'players', message: 'Lista de jogadores divergente.' });
      }
    }

    if (normalize(match.winner) !== normalize(log.winner)) {
      issues.push({ field: 'winner', message: 'Vencedor divergente entre Discord e backend.' });
    }

    if (isPositiveFiniteNumber(match.durationSeconds) && Math.abs(match.durationSeconds - log.durationSeconds) > 5) {
      issues.push({ field: 'duration', message: 'Duração divergente entre Discord e backend.' });
    }

    if (isPositiveFiniteNumber(match.mediatorRevenue) && match.mediatorRevenue !== log.mediatorRevenue) {
      issues.push({ field: 'mediatorRevenue', message: 'Receita do mediador divergente.' });
    }

    if (match.status && normalize(match.status) !== 'completed' && normalize(match.status) !== 'concluded') {
      issues.push({ field: 'status', message: 'Status da partida está inconsistente.' });
    }

    return { ok: issues.length === 0, issues };
  }
}
