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
  mediator?: string;
  mediatorId?: string;
  winner?: string;
  mediatorRevenue?: number;
  status?: string;
};

const normalize = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const isPositiveFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

export class ValidatorService {
  validate(
    log: SupervisorLogData,
    match: MatchRecord | null | undefined,
  ): SupervisorValidationResult {
    const issues: ValidationIssue[] = [];

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

    if (!log.mediatorName && !log.mediatorId) {
      issues.push({ field: 'mediator', message: 'Mediador ausente no log.' });
    }

    // Se não houver integração com a API ainda, não bloqueia
    if (!match) {
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

    if (
      normalize(match.mediator) !== normalize(log.mediatorName) &&
      normalize(match.mediatorId) !== normalize(log.mediatorId)
    ) {
      issues.push({ field: 'mediator', message: 'Mediador divergente entre Discord e backend.' });
    }

    if (normalize(match.winner) !== normalize(log.winner)) {
      issues.push({ field: 'winner', message: 'Vencedor divergente entre Discord e backend.' });
    }

    if (
      isPositiveFiniteNumber(match.mediatorRevenue) &&
      log.mediatorRevenue !== undefined &&
      match.mediatorRevenue !== log.mediatorRevenue
    ) {
      issues.push({ field: 'mediatorRevenue', message: 'Receita do mediador divergente.' });
    }

    return { ok: issues.length === 0, issues };
  }
}