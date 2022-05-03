import EmbedAuthor from './EmbedAuthor';
import EmbedFooter from './EmbedFooter';
import EmbedImage from './EmbedImage';
import Field from './Field';

export default interface Embed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: EmbedFooter;
  image?: EmbedImage;
  thumbnail?: EmbedImage;
  author?: EmbedAuthor;
  fields: Array<Field | undefined>;
}
