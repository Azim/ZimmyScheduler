package icu.azim.zimmy.commands.repeat;

import java.util.Arrays;
import java.util.List;

import org.javacord.api.entity.server.Server;
import org.javacord.api.entity.user.User;
import org.javacord.api.event.interaction.SlashCommandCreateEvent;
import org.javacord.api.interaction.SlashCommandInteraction;
import org.javacord.api.interaction.SlashCommandInteractionOption;
import org.javacord.api.interaction.callback.InteractionImmediateResponseBuilder;
import org.javacord.api.util.logging.ExceptionLogger;
import org.quartz.CronExpression;
import org.quartz.SchedulerException;

import icu.azim.zimmy.Zimmy;
import it.burning.cron.CronExpressionDescriptor;
import pw.mihou.velen.interfaces.VelenArguments;
import pw.mihou.velen.interfaces.VelenSlashEvent;
import redis.clients.jedis.Jedis;

public class Repeat implements VelenSlashEvent {

	@Override
	public void onEvent(SlashCommandCreateEvent originalEvent, 
			SlashCommandInteraction event, 
			User user,
			VelenArguments args, 
			List<SlashCommandInteractionOption> options,
			InteractionImmediateResponseBuilder firstResponder) {
		event.respondLater(true).thenAccept(updater->{
			Server server = event.getServer().orElseThrow();
			
			Long id = options.get(0).getLongValue().orElseThrow();
			String expression = options.get(1).getStringValue().orElseThrow();
			
			try(Jedis j = Zimmy.getInstance().getPool().getResource()){
				if(!j.exists("e:"+id+":data")) {
					updater.setContent("Message not found!").update();
					return;
				}
				if(!CronExpression.isValidExpression(expression)) {
					updater.setContent("Invalid [cron](https://www.freeformatter.com/cron-expression-generator-quartz.html#cronexpressionexamples) expression!").update();
					return;
				}
				if(!satisfiesLimit(expression)) {
					updater.setContent("Message will repeat too fast! Please make at least 30 minutes between executions.").update();
					return;
				}
				
				j.set("e:"+id+":cron", expression);
				try {
					Zimmy.getInstance().makeRepeat(server.getIdAsString(), id+"", expression);
				} catch (SchedulerException e) {
					updater.setContent("Exception while making message repeat!\n`"+e.getMessage()+"`").update();
					return;
				}
				updater.setContent("Message `#"+id+"` will be repeating "+CronExpressionDescriptor.getDescription(expression)+"\n`"+expression+"`").update();
			}
			
		}).exceptionally(ExceptionLogger.get());
	}
	
	private boolean satisfiesLimit(String cron) {
		String[] parts = cron.split(" ");
		String seconds = parts[0];
		String minutes = parts[1];
		if(minutes.contains("-")||seconds.contains("-")||seconds.contains("*")||seconds.contains("/")||seconds.contains(",")) {
			return false;
		}
		if(minutes.contains("/")) {
			String[] mparts = minutes.split("/");
			int m = Integer.valueOf(mparts[1]);
			if(m<30) return false;
		}
		if(minutes.contains(",")) {
			int[] mparts = Arrays.stream(minutes.split(",")).mapToInt(Integer::parseInt).toArray();
			int diff = findMinDiff(mparts);
			if(diff<30) return false;
		}
		return true;
	}
	
	//Yes i copied and adapted it from https://www.geeksforgeeks.org/find-minimum-difference-pair/ thank you
	private int findMinDiff(int[] arr)
    {
        int diff = 60;
        for (int i=0; i<arr.length-1; i++)
            for (int j=i+1; j<arr.length; j++)
                if (Math.abs((arr[i] - arr[j]) )< diff)
                    diff = Math.abs((arr[i] - arr[j]));
     
        return diff;
    }
}
