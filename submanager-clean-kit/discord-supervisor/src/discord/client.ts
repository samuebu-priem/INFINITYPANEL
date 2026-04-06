import { Client, GatewayIntentBits, Message, TextChannel } from 'discord.js';
import { ApiClient } from '../integrations/api/apiClient';
import { ParserService, SupervisorLogData } from '../modules/supervisor/parser.service';
import { ValidatorService } from '../modules/supervisor/validator.service';

type SupervisorClientOptions = {
  token: string;
  logChannelId: string;
  alertChannelId: string;
  apiClient: ApiClient;
  parserService: ParserService;
  validatorService: ValidatorService;
  sendStartupMessage?: boolean;
};

const isEmbedLogMessage = (message: Message<boolean>): boolean => {
  const embeds = message.embeds ?? [];
  if (!embeds.length) return false;
  const title = embeds[0]?.title ?? '';
  return /Aposta Concluída/i.test(title);
};

const formatCurrencyBRL = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const calculateMediatorProfit = (log: SupervisorLogData): number => {
  const playersCount = Array.isArray(log.players) ? log.players.length : 0;
  const grossRevenue = Number.isFinite(log.mediatorRevenue) ? log.mediatorRevenue : 0;
  const baseValue = Number.isFinite(log.initialValue) ? log.initialValue : 0;
  return Math.max(0, grossRevenue || baseValue * Math.max(0, playersCount - 1));
};

export class DiscordSupervisorClient {
  private readonly client: Client;

  constructor(private readonly options: SupervisorClientOptions) {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
    });
  }

  async start(): Promise<void> {
    this.client.once('ready', async () => {
      console.log(`Discord supervisor logged in as ${this.client.user?.tag ?? 'unknown user'}`);

      if (!this.options.sendStartupMessage) return;

      try {
        const alertChannel = await this.client.channels.fetch(this.options.alertChannelId);
        if (!alertChannel || !('isTextBased' in alertChannel) || !alertChannel.isTextBased()) return;

        const textChannel = alertChannel as TextChannel;
        await textChannel.send({
          content: [
            '🟢 Bot supervisor online',
            `User: ${this.client.user?.tag ?? 'unknown user'}`,
            `Canal de logs: ${this.options.logChannelId}`,
            `Canal de alertas: ${this.options.alertChannelId}`
          ].join('\n')
        });
      } catch (error) {
        console.error('Failed to send startup message:', error);
      }
    });

    this.client.on('messageCreate', async (message) => {
      try {
        if (message.channelId !== this.options.logChannelId) return;
        if (!isEmbedLogMessage(message)) return;

        const embed = message.embeds[0]?.data ?? message.embeds[0];
        const parsed = this.options.parserService.parse(embed as Record<string, unknown>);
        if (!parsed) return;

        const match = await this.options.apiClient.getMatchByThreadName(parsed.threadName);
        const result = this.options.validatorService.validate(parsed, match);

        if (result.ok) {
          const profit = calculateMediatorProfit(parsed);
          console.log(`[Supervisor] OK thread=${parsed.threadName} mediator=${parsed.mediator} profit=${formatCurrencyBRL(profit)}`);
          return;
        }

        const alertChannel = await this.client.channels.fetch(this.options.alertChannelId);
        if (!alertChannel || !('isTextBased' in alertChannel) || !alertChannel.isTextBased()) return;

        const textChannel = alertChannel as TextChannel;
        const profit = calculateMediatorProfit(parsed);
        const lines = [
          '⚠️ Divergência detectada no bot supervisor',
          `Thread: ${parsed.threadName}`,
          `Jogo: ${parsed.game}`,
          `Modalidade: ${parsed.mode}`,
          `Vencedor: ${parsed.winner}`,
          `Lucro do mediador: ${formatCurrencyBRL(profit)}`,
          `Erros:`,
          ...result.issues.map((issue) => `- ${issue.field}: ${issue.message}`)
        ];

        await textChannel.send({ content: lines.join('\n') });
      } catch (error) {
        console.error('Supervisor processing error:', error);
      }
    });

    await this.client.login(this.options.token);
  }

  async stop(): Promise<void> {
    await this.client.destroy();
  }
}
