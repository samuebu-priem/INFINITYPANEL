import { Client, Events, GatewayIntentBits, Message, TextChannel } from 'discord.js';
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
    this.client.once(Events.ClientReady, async () => {
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
    console.log('--- MESSAGE_CREATE ---');
    console.log('channelId recebido:', message.channelId);
    console.log('channelId esperado:', this.options.logChannelId);
    console.log('autor:', message.author?.tag ?? 'sem autor');
    console.log('é bot:', message.author?.bot);
    console.log('webhookId:', message.webhookId ?? 'sem webhook');
    console.log('conteúdo:', message.content || '[sem conteúdo]');
    console.log('embeds:', message.embeds.length);
    console.log('titulo embed:', message.embeds[0]?.title ?? '[sem título]');

    if (message.channelId !== this.options.logChannelId) {
      console.log('ignorado: canal diferente');
      return;
    }

    console.log('canal de log confirmado');

    if (!isEmbedLogMessage(message)) {
      console.log('ignorado: embed não passou no filtro');
      return;
    }

    console.log('embed de aposta concluída detectado');

    const embed = message.embeds[0]?.data ?? message.embeds[0];
    const parsed = this.options.parserService.parse(embed as Record<string, unknown>);

    console.log('resultado parser:', parsed);

    if (!parsed) {
      console.log('ignorado: parser retornou null');
      return;
    }

    const match = await this.options.apiClient.getMatchByThreadName(parsed.threadName);
    console.log('match encontrado na API:', !!match);

    const result = this.options.validatorService.validate(parsed, match);
    console.log('resultado validação:', result);

    const lucroMediador = parsed.mediatorRevenue ?? 0;
    console.log('lucro mediador:', lucroMediador);

    if (result.ok) {
      console.log(`validação OK | thread=${parsed.threadName} | lucro=${lucroMediador}`);
      return;
    }

    const alertChannel = await this.client.channels.fetch(this.options.alertChannelId);
    if (!alertChannel || !('isTextBased' in alertChannel) || !alertChannel.isTextBased()) {
      console.log('canal de alerta inválido');
      return;
    }

    const textChannel = alertChannel as TextChannel;
    const lines = [
      '⚠️ Divergência detectada no bot supervisor',
      `Thread: ${parsed.threadName}`,
      `Jogo: ${parsed.game}`,
      `Modalidade: ${parsed.mode}`,
      `Vencedor: ${parsed.winner}`,
      `Lucro do mediador: R$ ${Number(lucroMediador).toFixed(2)}`,
      'Erros:',
      ...result.issues.map((issue) => `- ${issue.field}: ${issue.message}`)
    ];

    await textChannel.send({ content: lines.join('\n') });
    console.log('alerta enviado');
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
