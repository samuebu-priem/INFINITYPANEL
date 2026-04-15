import { Client, EmbedBuilder, Events, GatewayIntentBits, Message, TextChannel } from 'discord.js';
import { ParserService, SupervisorLogData } from '../modules/supervisor/parser.service';
import { ValidatorService } from '../modules/supervisor/validator.service';
import { MatchRecorderService } from '../modules/supervisor/matchRecorder.service';

type SupervisorClientOptions = {
  token: string;
  logChannelId: string;
  alertChannelId: string;
  parserService: ParserService;
  validatorService: ValidatorService;
  sendStartupMessage?: boolean;
};

const isEmbedLogMessage = (message: Message<boolean>): boolean => {
  const embeds = message.embeds ?? [];
  if (!embeds.length) return false;

  const title = embeds[0]?.title ?? '';
  const description = embeds[0]?.description ?? '';
  const fieldsText =
    embeds[0]?.fields?.map((field) => `${field.name} ${field.value}`).join(' ') ?? '';

  return /concluíd|aposta|sucesso|encerrad|finalizad|fila/i.test(
    `${title} ${description} ${fieldsText}`,
  );
};

const formatCurrencyBRL = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const calculateMediatorProfit = (log: SupervisorLogData): number => {
  const grossRevenue = Number.isFinite(log.mediatorRevenue) ? (log.mediatorRevenue ?? 0) : 0;
  return Math.max(0, grossRevenue);
};

export class DiscordSupervisorClient {
  private readonly client: Client;
  private readonly mediatorRevenueTotals = new Map<string, number>();
  private readonly processedThreads = new Map<string, number>();
  private readonly matchRecorder = new MatchRecorderService();

  constructor(private readonly options: SupervisorClientOptions) {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    });
  }

  private isRecentDuplicate(threadName: string): boolean {
    const now = Date.now();
    const previous = this.processedThreads.get(threadName) ?? 0;

    if (previous && now - previous < 90_000) {
      return true;
    }

    this.processedThreads.set(threadName, now);

    // limpeza simples
    for (const [key, ts] of this.processedThreads.entries()) {
      if (now - ts > 10 * 60_000) {
        this.processedThreads.delete(key);
      }
    }

    return false;
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
            `Canal de alertas: ${this.options.alertChannelId}`,
          ].join('\n'),
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

        const embed = message.embeds[0];
        const parsed = this.options.parserService.parse(embed as unknown as Record<string, unknown>);

        console.log('resultado parser:', parsed);

        if (!parsed) {
          console.log('ignorado: parser retornou null');
          return;
        }

        if (this.isRecentDuplicate(parsed.threadName)) {
          console.log(`ignorado: thread duplicada recente (${parsed.threadName})`);
          return;
        }

        const playersCount = Array.isArray(parsed.players) ? parsed.players.length : 0;
        const mediatorProfit = calculateMediatorProfit(parsed);
        const mediatorId = parsed.mediatorId || 'unknown';

        const result = this.options.validatorService.validate(parsed, undefined);

        console.log('resultado validação:', result);

        const recorderResult = await this.matchRecorder.recordMatch({
          players: Array.isArray(parsed.players) ? parsed.players : [],
          threadName: parsed.threadName || 'Não informado',
          game: parsed.game || 'Não informado',
          mode: parsed.mode || 'Não informado',
          winner: parsed.winner || 'Não informado',
          mediatorId: parsed.mediatorId || 'unknown',
          mediatorName: parsed.mediatorName || 'Não informado',
          mediatorRevenue: mediatorProfit,
        });

        let effectiveMediatorTotal = this.mediatorRevenueTotals.get(mediatorId) ?? 0;

        if (recorderResult?.created) {
          effectiveMediatorTotal += mediatorProfit;
          this.mediatorRevenueTotals.set(mediatorId, effectiveMediatorTotal);
        }

        console.log(
          `contabilidade atualizada | mediador=${parsed.mediatorName} | filas=${playersCount} | lucroAtual=R$ ${mediatorProfit.toFixed(2)} | totalAcumulado=R$ ${effectiveMediatorTotal.toFixed(2)}`,
        );

        const alertChannel = await this.client.channels.fetch(alertChannelId);
        if (!alertChannel || !('isTextBased' in alertChannel) || !alertChannel.isTextBased()) {
          console.log('canal de alerta inválido');
          return;
        }

        const textChannel = alertChannel as TextChannel;
        const currentTime = new Date().toLocaleString('pt-BR');
        const issuesText = result.issues.map((issue) => `${issue.field}: ${issue.message}`).join('\n');

        const embedBuilder = new EmbedBuilder()
          .setColor(0x3B82F6)
          .setTitle('📊 Fila contabilizada')
          .setDescription('Registro operacional detectado pelo supervisor.')
          .addFields(
            { name: '👤 Mediador', value: parsed.mediatorName || 'Não informado', inline: true },
            { name: '🧾 Mediador ID', value: parsed.mediatorId || 'Não informado', inline: true },
            { name: '📈 Filas concluídas', value: String(playersCount), inline: true },
            { name: '💰 Lucro da aposta', value: formatCurrencyBRL(mediatorProfit), inline: true },
            { name: '📊 Total acumulado do mediador', value: formatCurrencyBRL(effectiveMediatorTotal), inline: true },
            { name: '🏆 Último vencedor', value: parsed.winner || 'Não informado', inline: true },
            { name: '🧵 Thread', value: parsed.threadName || 'Não informado', inline: false },
            { name: '🗂️ Jogo', value: parsed.game || 'Não informado', inline: true },
            { name: '🎮 Modalidade', value: parsed.mode || 'Não informado', inline: true },
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