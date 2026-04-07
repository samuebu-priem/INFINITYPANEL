import { Client, EmbedBuilder, Events, GatewayIntentBits, Message, TextChannel } from 'discord.js';
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
  return /concluíd|aposta|sucesso/i.test(title);
};

const formatCurrencyBRL = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const calculateMediatorProfit = (log: SupervisorLogData): number => {
  const playersCount = Array.isArray(log.players) ? log.players.length : 0;
  const grossRevenue = Number.isFinite(log.mediatorRevenue) ? (log.mediatorRevenue ?? 0) : 0;
  const netRevenue = Math.max(0, grossRevenue);
  return Math.max(0, netRevenue * Math.max(0, playersCount - 1));
};

const formatSupervisorFooter = (): string => `Supervisor ativo • ${new Date().toLocaleTimeString('pt-BR')}`;

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

    this.client.on(Events.MessageCreate, async (message) => {
      try {
        const receivedChannelId = message.channelId;
        const logChannelId = this.options.logChannelId;
        const alertChannelId = this.options.alertChannelId;

        const embedCount = message.embeds.length;
        const embedTitle = message.embeds[0]?.title ?? '';
        const isFromLogChannel = receivedChannelId === logChannelId;
        const isFromAlertChannel = receivedChannelId === alertChannelId;
        const isLogEmbed = isEmbedLogMessage(message);

        console.log('--- MESSAGE_CREATE ---');
        console.log('channelId recebido:', receivedChannelId);
        console.log('autor:', message.author?.tag ?? 'sem autor');
        console.log('é bot:', message.author?.bot);
        console.log('conteúdo:', message.content || '[sem conteúdo]');
        console.log('embeds:', embedCount);
        console.log('titulo embed:', embedTitle);
        console.log('isFromLogChannel:', isFromLogChannel);
        console.log('isFromAlertChannel:', isFromAlertChannel);
        console.log('isLogEmbed:', isLogEmbed);

        if (isFromAlertChannel && message.author?.id === this.client.user?.id) {
          console.log('ignorado: mensagem do próprio supervisor no canal de alertas');
          return;
        }

        if (!isFromLogChannel) {
          console.log('ignorado: mensagem fora do canal de logs');
          return;
        }

        if (!isLogEmbed) {
          console.log('ignorado: mensagem do canal de logs sem embed de aposta concluída');
          return;
        }

        console.log('mensagem válida de aposta concluída detectada');

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

        const mediatorProfit = parsed.mediatorRevenue && parsed.mediatorRevenue > 0 ? parsed.mediatorRevenue : 0;

        if (result.ok) {
          console.log(`validação OK | thread=${parsed.threadName} | lucro mediador=R$ ${mediatorProfit.toFixed(2)}`);
          return;
        }

        const alertChannel = await this.client.channels.fetch(alertChannelId);
        if (!alertChannel || !('isTextBased' in alertChannel) || !alertChannel.isTextBased()) {
          console.log('canal de alerta inválido');
          return;
        }

        const textChannel = alertChannel as TextChannel;
        const currentTime = new Date().toLocaleString('pt-BR');
        const issuesText = result.issues.map((issue) => `${issue.field}: ${issue.message}`).join('\n');
        const playersCount = Array.isArray((parsed as { players?: unknown[] }).players)
          ? (parsed as { players?: unknown[] }).players!.length
          : 0;
        const embedBuilder = new EmbedBuilder()
          .setColor(0x3B82F6)
          .setTitle('📊 Nova Fila Registrada')
          .setDescription('Registro operacional detectado pelo supervisor.')
          .addFields(
            { name: '👤 Mediador', value: parsed.mediatorId || 'Não informado', inline: true },
            { name: '🎮 Modalidade', value: parsed.mode || 'Não informado', inline: true },
            { name: '📈 Filas', value: String(playersCount), inline: true },
            { name: '💰 Lucro Acumulado', value: formatCurrencyBRL(mediatorProfit), inline: true },
            { name: '🏆 Último Vencedor', value: parsed.winner || 'Não informado', inline: true },
            { name: '🧵 Thread', value: parsed.threadName || 'Não informado', inline: false },
            { name: '🗂️ Jogo', value: parsed.game || 'Não informado', inline: true },
            { name: '🆔 ID do Mediador', value: parsed.mediatorId || 'Não informado', inline: true }
          )
          .setFooter({ text: `Supervisor ativo • ${currentTime}` });

        if (issuesText) {
          embedBuilder.addFields({ name: 'Erros', value: issuesText.slice(0, 1024) });
        }

        await textChannel.send({ embeds: [embedBuilder] });
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
