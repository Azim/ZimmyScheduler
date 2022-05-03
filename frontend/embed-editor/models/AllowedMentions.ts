export default interface AllowedMentions {
  parse: Array<string | undefined>;
  roles?: Array<string | undefined>;
  users?: Array<string | undefined>;
}
