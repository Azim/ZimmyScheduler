import {Field as EmbedField} from './classes';

export class EmbedFooter{
    text:string;
    icon_url?:string;
    proxy_icon_url?:string;
    constructor(text:string){
        this.text = text;
    }
}
export class EmbedImage{
    url:string;
    proxy_url?:string;
    height?:number;
    width?:number;
    //ignore proxy and sizes for now, but maybe keep them if user inputs them?
    constructor(url:string){
        this.url = url;
    }
}
export class EmbedAuthor{
    name:string;
    url?:string;
    icon_url?:string;
    proxy_icon_url?:string;

    constructor(name:string){
        this.name = name;
    }
}

export class Embed{
    title?:string;
    //type - always rich for webhooks
    description?:string;
    url?:string;
    timestamp?:string;//ISO8601 timestamp
    color?:number;
    footer?:EmbedFooter;
    image?:EmbedImage;
    thumbnail?:EmbedImage;//same structure, will create a new one if this ever changes, which it probably wont
    author?:EmbedAuthor;
    fields?:EmbedField[];
}

export class AllowedMentions{
    parse: string[] = [];
    roles?: string[];
    users?: string[];
    replied_user?: boolean; //for replies, we'll keep it as undefined
}

export class WebhookMessage{
    content?:string;
    username?:string;
    avatar_url?:string;
    embeds?:Embed[];
    allowed_mentions?:AllowedMentions;
}
