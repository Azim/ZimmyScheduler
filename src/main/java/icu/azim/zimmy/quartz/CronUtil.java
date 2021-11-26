package icu.azim.zimmy.quartz;

import java.util.Date;
import java.util.TimeZone;

import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.SimpleScheduleBuilder;
import org.quartz.CronScheduleBuilder;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.quartz.TriggerKey;

import icu.azim.zimmy.Zimmy;
import it.burning.cron.CronExpressionDescriptor;
import redis.clients.jedis.Jedis;

public class CronUtil {

	public static String getRepeatString(String eid, Jedis j) {
		String type = j.get(eid+":r:type");
		if(type==null) {
			return "`once`";
		}
		if(type.equalsIgnoreCase("cron")) {
			String cron = j.get(eid+":r:pattern");
			return "`"+CronExpressionDescriptor.getDescription(cron)+"`\n`"+cron+"`";
		}
		if(type.equalsIgnoreCase("minutes")) {
			String minutes = j.get(eid+":r:pattern");
			return "`each "+minutes+" minutes`";
		}
		return "`error`";
	}
	
	
	public static TriggerKey getTrigger(String id) throws SchedulerException {
		Scheduler scheduler = Zimmy.getInstance().scheduler;
		TriggerKey result = new TriggerKey("triggerOnce_"+id);
		if(scheduler.checkExists(result)) {
			return result;
		}
		result = new TriggerKey("triggerCron_"+id);
		if(scheduler.checkExists(result)) {
			return result;
		}
		result = new TriggerKey("triggerMinute_"+id);
		if(scheduler.checkExists(result)) {
			return result;
		}
		return null;
	}
	
	public static void registerOnce(Date date, String id) throws SchedulerException {
		Scheduler scheduler = Zimmy.getInstance().scheduler;
		
		TriggerKey oldKey = getTrigger(id);
		if(oldKey!=null) {
			return;
		}
		Trigger t = TriggerBuilder.newTrigger()
				.withIdentity("triggerOnce_"+id)
				.usingJobData("eid", id)
				.forJob(new JobKey("send"))
				.startAt(date)
				.build();
		scheduler.scheduleJob(t);
	}
	
	public static boolean makeRepeatMinutes(String server, String id, int interval) throws SchedulerException {
		Scheduler scheduler = Zimmy.getInstance().scheduler;

		TriggerKey oldKey = getTrigger(id);
		if(oldKey==null) {
			return false;
		}
		
		Trigger t = scheduler.getTrigger(oldKey);
		Date date = t.getStartTime();
		scheduler.unscheduleJob(oldKey);
		
		t = TriggerBuilder.newTrigger()
				.withIdentity("triggerMinute_"+id)
				.usingJobData("eid", id)
				.forJob(new JobKey("send"))
				.startAt(date)
				.withSchedule(SimpleScheduleBuilder.simpleSchedule().repeatForever().withIntervalInMinutes(interval))
				.build();
		scheduler.scheduleJob(t);
		return true;
	}
	public static boolean makeRepeatOnce(String id) throws SchedulerException {
		Scheduler scheduler = Zimmy.getInstance().scheduler;

		TriggerKey oldKey = getTrigger(id);
		if(oldKey==null) {
			return false;
		}
		
		Trigger t = scheduler.getTrigger(oldKey);
		Date date = t.getStartTime();
		scheduler.unscheduleJob(oldKey);
		
		t = TriggerBuilder.newTrigger()
				.withIdentity("triggerOnce_"+id)
				.usingJobData("eid", id)
				.forJob(new JobKey("send"))
				.startAt(date)
				.build();
		scheduler.scheduleJob(t);
		
		return true;
	}
	public static boolean makeRepeatCron(String server, String id, String cron) throws SchedulerException {
		Scheduler scheduler = Zimmy.getInstance().scheduler;

		TriggerKey oldKey = getTrigger(id);
		if(oldKey==null) {
			return false;
		}
		
		try(Jedis j = Zimmy.getInstance().getPool().getResource()){
			String timezone = j.get("s:"+server+":timezone");
			if(timezone==null) {
				timezone = "GMT";
			}
			Trigger t = scheduler.getTrigger(oldKey);
			Date date = t.getStartTime();
			scheduler.unscheduleJob(oldKey);
			
			t = TriggerBuilder.newTrigger()
					.withIdentity("triggerCron_"+id)
					.usingJobData("eid", id)
					.forJob(new JobKey("send"))
					.startAt(date)
					.withSchedule(CronScheduleBuilder.cronSchedule(cron).inTimeZone(TimeZone.getTimeZone(timezone)).withMisfireHandlingInstructionDoNothing())
					.build();
			scheduler.scheduleJob(t);
		}
		return true;
	}
	
	
	public static void deleteTrigger(String id) throws SchedulerException {
		TriggerKey t = getTrigger(id);
		if(t==null) {
			return;
		}
		Zimmy.getInstance().scheduler.unscheduleJob(t);
	}
	
	public static void editTime(Date date, String id) throws SchedulerException {
		Scheduler scheduler = Zimmy.getInstance().scheduler;
		TriggerKey key = getTrigger(id);
		if(key==null) {
			registerOnce(date, id);
		}else {
			Trigger t = scheduler.getTrigger(key);
			t = t.getTriggerBuilder().startAt(date).build();
			scheduler.rescheduleJob(t.getKey(), t);
		}
	}
}
