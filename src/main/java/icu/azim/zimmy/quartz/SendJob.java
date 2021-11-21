package icu.azim.zimmy.quartz;

import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;

import icu.azim.zimmy.Zimmy;
import icu.azim.zimmy.util.ServerUtil;
import icu.azim.zimmy.util.WebhookPayload;
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
			payload.execute(false).thenAccept(success->{
				Zimmy.getInstance().api.getServerTextChannelById(channel).ifPresent(ch->{
					ch.sendMessage("Sent message `#"+eid+"`");
				});
				ServerUtil.removeTask(eid, j);
				
			}).exceptionally(e->{
				Zimmy.getInstance().api.getServerTextChannelById(channel).ifPresent(ch->{
					ch.sendMessage("Error occured while sending message `#"+eid+"`:\n`"+e.getMessage()+"`");
					ch.sendMessage(payload.getDisplayInfo());
				});
				return null;
			});
			
		}
	}

}
