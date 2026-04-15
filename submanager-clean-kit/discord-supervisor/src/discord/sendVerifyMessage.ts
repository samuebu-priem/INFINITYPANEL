import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  TextChannel,
} from "discord.js";

const CHANNEL_ID = "1494083160852398101";
const BUTTON_ID = "get_discord_id";
const EMBED_TITLE = "🔗 Vincular conta ao site";

export async function sendVerifyMessage(client: Client) {
  const channel = await client.channels.fetch(CHANNEL_ID);

  if (!channel || !("isTextBased" in channel) || !channel.isTextBased()) {
    return;
  }

  const textChannel = channel as TextChannel;

  const recentMessages = await textChannel.messages.fetch({ limit: 20 });

  const existingMessage = recentMessages.find(
    (message) =>
      message.author.id === client.user?.id &&
      message.embeds?.[0]?.title === EMBED_TITLE
  );

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(EMBED_TITLE)
    .setDescription(
      [
        "Clique no botão abaixo para ver seu ID do Discord.",
        "A resposta aparecerá **somente para você**.",
        "",
        "Depois, copie o ID e cole no site para vincular sua conta.",
      ].join("\n")
    )
    .setFooter({ text: "Infinity Supervisor" });

  const button = new ButtonBuilder()
    .setCustomId(BUTTON_ID)
    .setLabel("📋 Ver meu ID")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  if (existingMessage) {
    await existingMessage.edit({
      embeds: [embed],
      components: [row],
    });

    try {
      await existingMessage.pin();
    } catch {}

    console.log("Mensagem de ver ID já existia e foi atualizada.");
    return;
  }

  const sentMessage = await textChannel.send({
    embeds: [embed],
    components: [row],
  });

  try {
    await sentMessage.pin();
  } catch {}

  console.log("Mensagem de ver ID enviada e fixada com sucesso.");
}