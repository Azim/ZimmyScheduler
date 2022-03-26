package icu.azim.zimmy.commands.repeat;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

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
import icu.azim.zimmy.quartz.CronUtil;
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
			String type  = options.get(1).getStringValue().orElseThrow();
			String expression = options.get(2).getStringValue().orElseThrow();
			
			try(Jedis j = Zimmy.getInstance().getPool().getResource()){
				
				if(!j.exists("e:"+id+":data")) {
					updater.setContent("Message not found!").update();
					return;
				}
				
				switch(type) {
				case "cron":
					if(!CronExpression.isValidExpression(expression)) {
						updater.setContent("Invalid [cron](https://www.freeformatter.com/cron-expression-generator-quartz.html#cronexpressionexamples) expression!").update();
						return;
					}
					if(!satisfiesLimit(expression)) {
						updater.setContent("Message will repeat too fast! Please make at least 30 minutes between executions.").update();
						return;
					}
					j.set("e:"+id+":r:type", "cron");
					j.set("e:"+id+":r:pattern", expression);
					try {
						if(!CronUtil.makeRepeatCron(server.getIdAsString(), id+"", expression)) {
							updater.setContent("Message not found in database! Please contact administrator if you get this message often. \nAs a workaround, try editing the message and changing it's planned date.").update();
							return;
						}
					} catch (SchedulerException e) {
						updater.setContent("Exception while making message repeat!\n`"+e.getMessage()+"`").update();
						return;
					}
					updater.setContent("Message `#"+id+"` will be repeating "+CronUtil.getRepeatString("e:"+id, j)).update();
					break;
				case "minutes":
					try {
						int minutes = Integer.valueOf(expression);
						if(minutes<30) {
							updater.setContent("Message will repeat too fast! Please make at least 30 minutes between executions.").update();
							return;
						}
						j.set("e:"+id+":r:type", "minutes");
						j.set("e:"+id+":r:pattern", minutes+"");
						try {
							if(!CronUtil.makeRepeatMinutes(server.getIdAsString(), id+"", minutes)) {
								updater.setContent("Message not found in database! Please contact administrator if you get this message often. \nAs a workaround, try editing the message and changing it's planned date.").update();
								return;
							}
						} catch (SchedulerException e) {
							updater.setContent("Exception while making message repeat!\n`"+e.getMessage()+"`").update();
							return;
						}
						updater.setContent("Message `#"+id+"` will be repeating "+CronUtil.getRepeatString("e:"+id, j)).update();
						
					} catch(NumberFormatException e) {
						updater.setContent("Expected a *number* of minutes").update();
						return;
					}
					break;
				}
			}
		}).exceptionally(ExceptionLogger.get());
	}
	
	private boolean satisfiesLimit(String cron) {
		String[] parts = cron.split(" ");
		String seconds = parts[0];
		String minutes = parts[1];
		String hours = parts[2];
		boolean needsHoursApart = false;
		if(minutes.contains("*")||minutes.contains("-")||seconds.contains("-")||seconds.contains("*")||seconds.contains("/")||seconds.contains(",")) {
			return false;
		}
		if(minutes.contains("/")) {
			String[] mparts = minutes.split("/");
			int m = Integer.valueOf(mparts[1]);
			if(m<30) return false;
		}
		if(minutes.contains(",")) {
			List<Integer> mparts = Arrays.stream(minutes.split(",")).mapToInt(Integer::parseInt).boxed().collect(Collectors.toList());
			int diff = findMinDiff(mparts);
			if(diff<30) return false;
			if(mparts.size()>2) return false;
			if(diff!=30) needsHoursApart = true;
		}
		if(needsHoursApart) {
			if(hours.contains("*")||hours.contains("-")) return false;
			if(hours.contains("/")) 
				if(Integer.valueOf(hours.split("/")[1])<2) return false;

			if(hours.contains(",")) {
				List<Integer> hparts = Arrays.stream(hours.split(",")).mapToInt(Integer::parseInt).boxed().collect(Collectors.toList());
				if(findMinDiff(hparts) < 2) return false;
				if(hparts.contains(0)&&hparts.contains(23)) return false;
			}
			
		}
		return true;
	}
	
	//Yes i copied and adapted it from https://www.geeksforgeeks.org/find-minimum-difference-pair/ thank you
	private int findMinDiff(List<Integer> arr)
    {
        int diff = 60;
        for (int i=0; i<arr.size()-1; i++)
            for (int j=i+1; j<arr.size(); j++) {
                if (Math.abs((arr.get(i) - arr.get(j)) )< diff)
                    diff = Math.abs((arr.get(i) - arr.get(j)));
                
            }
        return diff;
    }
	
}
