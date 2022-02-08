package icu.azim.zimmy.quartz;

import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.SchedulerException;

import icu.azim.zimmy.Zimmy;
import icu.azim.zimmy.util.ServerConfig;
import icu.azim.zimmy.util.ServerConfig.NotificationType;
import icu.azim.zimmy.util.ServerUtil;
import icu.azim.zimmy.util.payload.WebhookPayload;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

public class SendJob implements Job{

	@Override
	public void execute(JobExecutionContext context) throws JobExecutionException {
		JobDataMap dataMap = context.getTrigger().getJobDataMap();
		String eid = dataMap.getString("eid");
		JedisPool pool = Zimmy.getInstance().getPool();
		
		try(Jedis j = pool.getResource()){
			WebhookPayload payload = WebhookPayload.fromRedis(eid, j);
			
			String server = j.get("e:"+eid+":server");
			String channel = j.get("s:"+server+":channel");
			String n = j.get("s:"+server+":notifications");
			
			ServerConfig.NotificationType notify;
			if(n==null) {
				notify = NotificationType.ALL;
			}else {
				notify = NotificationType.valueOf(n);
			}
			
			Zimmy.getInstance().api.getServerTextChannelById(channel).ifPresentOrElse(ch->{
				boolean once = j.get("e:"+eid+":r:type")==null;
				boolean external = j.get("e:"+eid+":mention")==null || j.get("e:"+eid+":mention").equalsIgnoreCase("`External server`");
				
				payload.execute(false).thenAccept(success->{
					if(once) { //was a one-time
						ServerUtil.removeTask(eid, j);
					}
				}).exceptionally(e->{
					ch.sendMessage("Error occured while sending message `#"+eid+"`:\n`"+e.getMessage()+"`");
					ch.sendMessage(payload.getDisplayInfo());
					return null;
				});
				
				boolean send =  switch (notify) {
				case ALL ->{
					yield true;
				}
				case EXTERNAL -> {
					yield external;
				}
				case NONE -> {
					yield false;
				}
				case NON_REPEATING -> {
					yield once;
				}
				default -> throw new IllegalArgumentException("Unexpected value: " + notify);
				
				};
				if(send) {
					ch.sendMessage("Sent message `#"+eid+"`");
				}
			},()->{
				if(Zimmy.getInstance().api.getServerById(server).isEmpty()) { //left the server or server doesnt exist
					try {
						Zimmy.getInstance().scheduler.unscheduleJob(context.getTrigger().getKey());
					} catch (SchedulerException e) {
						e.printStackTrace();
					}
				}
			});
		}
	}
}
