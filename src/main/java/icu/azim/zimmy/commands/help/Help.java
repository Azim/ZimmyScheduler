package icu.azim.zimmy.commands.help;

import java.util.List;

import org.javacord.api.entity.message.embed.EmbedBuilder;
import org.javacord.api.entity.user.User;
import org.javacord.api.event.interaction.SlashCommandCreateEvent;
import org.javacord.api.interaction.SlashCommandInteraction;
import org.javacord.api.interaction.SlashCommandInteractionOption;
import org.javacord.api.interaction.callback.InteractionCallbackDataFlag;
import org.javacord.api.interaction.callback.InteractionImmediateResponseBuilder;

import pw.mihou.velen.interfaces.VelenArguments;
import pw.mihou.velen.interfaces.VelenSlashEvent;

public class Help implements VelenSlashEvent {

	@Override
	public void onEvent(SlashCommandCreateEvent originalEvent, 
			SlashCommandInteraction event, 
			User user,
			VelenArguments args, 
			List<SlashCommandInteractionOption> options,
			InteractionImmediateResponseBuilder firstResponder) {
		
		event.createImmediateResponder().setFlags(InteractionCallbackDataFlag.EPHEMERAL).addEmbeds(new EmbedBuilder()
				.setTitle("Azim's delayed webhook execution bot")
				.setDescription(
						"`/configure` - configure the bot (initial setup, control role and channel, timezone)\n"+
						"`/schedule` - prepare a message to be sent sometime somewhere\n"+
						"`/planned` - show planned messages\n"+
						"`/edit` - edit planned message\n"+
						"`/help` - show this message"
						),
				new EmbedBuilder().setDescription(
						"Most of the commands require user to have control role and only work in control channel, so make sure to set them first up via `/configure`\n"+
						"[Required permissions](https://gist.github.com/Azim/f1b2b6dbfe004c5a66511b1a3f8589b2)\n"+
						"[Privacy policy](https://gist.github.com/Azim/4bbccc2ca0206cf2c840740253f65c14)\n"+
						"[Bot invite link](https://discord.com/oauth2/authorize?client_id=721752791512776806&permissions=805424208&scope=bot%20applications.commands&prompt=consent)\n"+
						"You can report a bug or leave your feedback [here](https://discord.gg/nBjSGa4)\n"+
						"You can vote for this bot or leave a rewiev [here](https://top.gg/bot/721752791512776806)\n"+
						"You can donate [here](https://en.liberapay.com/Azim0ff/)"
						)
				).respond();
	}

}
