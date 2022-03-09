
export class Field{
    name: string;
    value: string;
    inline: boolean;

    constructor(name: string, value: string, inline: boolean){
        this.name = name;
        this.value = value;
        this.inline = inline;
    }
}

export class EmbedAuthor{
    author: string;
    author_url: string;
    author_icon_url: string;
    
    constructor(author: string, author_url: string, author_icon_url: string){
        this.author = author;
        this.author_url = author_url;
        this.author_icon_url = author_icon_url;
    }
}

export class EmbedBody{
    title: string;
    description: string;
    url: string;
    color: string;

    constructor(title: string, description: string, url: string, color: string){
        this.title = title;
        this.description = description;
        this.url = url;
        this.color = color;
    }
}

export class EmbedFooter{
    footer: string;
    timestamp: number;
    footer_icon_url: string;

    constructor(footer: string, timestamp: number, footer_icon_url: string){
        this.footer = footer;
        this.timestamp = timestamp;
        this.footer_icon_url = footer_icon_url;
    }
}

export class Embed{
    author: EmbedAuthor;
    body: EmbedBody;
    fields: Field[];
    image_url: string;
    thumbnail_url: string;
    footer: EmbedFooter;

    
    constructor(){
        this.author = new EmbedAuthor('','','');
        this.body = new EmbedBody('','','','',);
        this.image_url = '';
        this.thumbnail_url = '';
        this.footer = new EmbedFooter('',0,'',);
        this.fields = [];
    }
}

export class MessageAuthor{
    username: string;
    avatar_url: string;
    
    constructor(username: string, avatar_url: string){
        this.username = username;
        this.avatar_url = avatar_url;
    }
}

export class Message{
    author: MessageAuthor;
    content: string;
    embeds: Embed[];

    constructor(){
        this.author = new MessageAuthor('','');
        this.content = '';
        this.embeds = [];
    }

    toJson(){

    }
}