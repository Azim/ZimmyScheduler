import AllowedMentions from './AllowedMentions';
import Embed from './Embed';

export default interface Message {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds: Array<Embed | undefined>;
  allowed_mentions?: AllowedMentions;
}
