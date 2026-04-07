export type MediatorMetrics = {
  mediatorId: string;
  mediatorName: string;
  totalQueues: number;
  totalRevenue: number;
  totalDurationSeconds: number;
  totalPlayers: number;
  lastProcessedAt: string;
};

export type CompletedQueueRecord = {
  logKey: string;
  threadName: string;
  mediatorId?: string;
  mediatorName: string;
  winner: string;
  game: string;
  mode: string;
  mediatorRevenue?: number;
  durationSeconds?: number;
  playersCount?: number;
  processedAt?: Date;
};

export class MetricsService {
  private readonly processedLogs = new Set<string>();
  private readonly mediatorMetrics = new Map<string, MediatorMetrics>();

  hasProcessed(logKey: string): boolean {
    return this.processedLogs.has(this.normalizeKey(logKey));
  }

  markProcessed(logKey: string): boolean {
    const normalizedKey = this.normalizeKey(logKey);
    if (this.processedLogs.has(normalizedKey)) return false;
    this.processedLogs.add(normalizedKey);
    return true;
  }

  recordCompletedQueue(record: CompletedQueueRecord): MediatorMetrics {
    const normalizedLogKey = this.normalizeKey(record.logKey);
    if (!this.markProcessed(normalizedLogKey)) {
      return this.getMediatorTotals(record.mediatorId ?? record.mediatorName) ?? this.buildEmptyMetrics(record);
    }

    const mediatorKey = this.getMediatorKey(record.mediatorId, record.mediatorName);
    const current = this.mediatorMetrics.get(mediatorKey) ?? this.buildEmptyMetrics(record);

    const updated: MediatorMetrics = {
      mediatorId: record.mediatorId?.trim() || current.mediatorId,
      mediatorName: record.mediatorName.trim() || current.mediatorName,
      totalQueues: current.totalQueues + 1,
      totalRevenue: current.totalRevenue + this.safeNumber(record.mediatorRevenue),
      totalDurationSeconds: current.totalDurationSeconds + this.safeNumber(record.durationSeconds),
      totalPlayers: current.totalPlayers + this.safeNumber(record.playersCount),
      lastProcessedAt: (record.processedAt ?? new Date()).toISOString()
    };

    this.mediatorMetrics.set(mediatorKey, updated);
    return updated;
  }

  getMediatorTotals(mediatorIdOrName: string): MediatorMetrics | null {
    const key = this.normalizeKey(mediatorIdOrName);
    if (!key) return null;

    if (this.mediatorMetrics.has(key)) {
      return this.mediatorMetrics.get(key) ?? null;
    }

    for (const [storedKey, metrics] of this.mediatorMetrics.entries()) {
      if (storedKey === key) return metrics;
      if (this.normalizeKey(metrics.mediatorName) === key) return metrics;
      if (metrics.mediatorId && this.normalizeKey(metrics.mediatorId) === key) return metrics;
    }

    return null;
  }

  getAllMediatorTotals(): MediatorMetrics[] {
    return Array.from(this.mediatorMetrics.values());
  }

  formatOperationalOutput(): string {
    const totals = this.getAllMediatorTotals().sort((a, b) => b.totalQueues - a.totalQueues);

    if (!totals.length) {
      return '📊 Fila contabilizada\nNenhum mediador contabilizado ainda.';
    }

    const lines = ['📊 Fila contabilizada'];
    for (const metrics of totals) {
      lines.push(
        `Mediador: ${metrics.mediatorName || metrics.mediatorId}`,
        `Filas: ${metrics.totalQueues}`,
        `Receita: ${this.formatCurrencyBRL(metrics.totalRevenue)}`,
        `Duração total: ${this.formatDuration(metrics.totalDurationSeconds)}`,
        `Jogadores totais: ${metrics.totalPlayers}`,
        `Última atualização: ${metrics.lastProcessedAt}`
      );
    }

    return lines.join('\n');
  }

  private getMediatorKey(mediatorId: string | undefined, mediatorName: string): string {
    return this.normalizeKey(mediatorId) || this.normalizeKey(mediatorName);
  }

  private buildEmptyMetrics(record: CompletedQueueRecord): MediatorMetrics {
    return {
      mediatorId: record.mediatorId?.trim() || '',
      mediatorName: record.mediatorName.trim(),
      totalQueues: 0,
      totalRevenue: 0,
      totalDurationSeconds: 0,
      totalPlayers: 0,
      lastProcessedAt: (record.processedAt ?? new Date()).toISOString()
    };
  }

  private normalizeKey(value: string | undefined | null): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  }

  private safeNumber(value: number | undefined): number {
    return Number.isFinite(value) ? Number(value) : 0;
  }

  private formatCurrencyBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  private formatDuration(totalSeconds: number): string {
    const seconds = Math.max(0, Math.trunc(totalSeconds));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
  }
}