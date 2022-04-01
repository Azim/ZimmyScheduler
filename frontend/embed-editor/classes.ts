import * as d from './discord-classes';
import * as validators from './validators';
import '@skyra/discord-components-core';
import { html } from 'lit';

export class Field{
    name: string = '';
    value: string = '';
    inline?: boolean = false;
}

export class EmbedAuthor{
    author: string = '';
    author_url: string = '';
    author_icon_url: string = '';
}

export class EmbedBody{
    title: string = '';
    description: string = '';
    url: string = '';
    color: string = '';
}

//TODO add possible undefines everywhere applicable
export class EmbedFooter{
    footer: string = '';
    timestamp: string = '';
    footer_icon_url: string = '';
}

export class Embed{
    author: EmbedAuthor;
    body: EmbedBody;
    fields: Field[];
    image_url: string;
    thumbnail_url: string;
    footer: EmbedFooter;

    
    constructor(){
        this.author = new EmbedAuthor();
        this.body = new EmbedBody();
        this.image_url = '';
        this.thumbnail_url = '';
        this.footer = new EmbedFooter();
        this.fields = [];
    }
}

export class MessageAuthor{
    username: string = '';
    avatar_url: string = '';
}

export class Message{
    author: MessageAuthor;
    content: string;
    embeds: Embed[];

    constructor(){
        this.author = new MessageAuthor();
        this.content = '';
        this.embeds = [];
    }

    toDiscohook(){
        var obj = {
            messages: [
                {
                    data: JSON.parse(this.toJson())
                }
            ]
        }
        return 'https://discohook.org/?message='+btoa(JSON.stringify(obj));
    }

    toPreview(){
        window.$discordMessage = {
            profiles: {
                preview: {
                    author: this.author.username,
                    avatar: this.author.avatar_url,
                    bot: true,
                    verified: false
                }
            }
        }

        return html`
            <discord-messages>
                <discord-message 
                    author="${this.author.username.length>0?this.author.username:'Webhook username'}" 
                    avatar="${this.author.avatar_url.length>0?this.author.avatar_url:'https://cdn.discordapp.com/attachments/654503812593090602/665721752277483540/red.png'}" 
                bot>
                    ${this.content}
                    ${this.embeds.map(embed=>{
                        return html`
                            <discord-embed
                                slot="embeds"
                                author-image="${embed.author.author_icon_url}"
                                author-name="${embed.author.author}"
                                author-url="${embed.author.author_url}"
                                color="${embed.body.color}"
                                embed-title="${embed.body.title}"
                                image="${embed.image_url}"
                                thumbnail="${embed.thumbnail_url}"
                                url="${embed.body.url}"
                            >
                                <discord-embed-description slot="description">
                                    ${embed.body.description}
                                </discord-embed-description>
                                <discord-embed-fields slot="fields">
                                    ${embed.fields.map(field=>{
                                        return html`
                                            <discord-embed-field field-title="${field.name}">${field.value}</discord-embed-field>
                                        `;
                                    })}
                                </discord-embed-fields>
                            </discord-embed>
                        `;
                    })}

                </discord-message>
            </discord-messages>
        `;

    }

    toDiscordFormat(){
        var res = new d.WebhookMessage();
        if(this.content.length>0) res.content = this.content;
        if(this.author.username.length>0) res.username = this.author.username;
        if(this.author.avatar_url.length>0) res.avatar_url = this.author.avatar_url;
        if(this.embeds.length>0){
            res.embeds = [];
            this.embeds.forEach(embed => {
                var ne: d.Embed = new d.Embed();
                
                if(embed.body.title.length > 0) ne.title = embed.body.title;
                if(embed.body.description.length > 0) ne.description = embed.body.description;
                if(embed.body.url.length > 0) ne.url = embed.body.url;
                if(embed.footer.timestamp.length > 0) ne.timestamp = embed.footer.timestamp;

                if(embed.body.color.length>0 && embed.body.color!='#rrggbb' && validators.isHexColor(embed.body.color)) {
                    //inspired by https://github.com/discohook/site/blob/main/common/input/color/ColorModel.ts#L90
                    const [, red = 0, green = 0, blue = 0] =
                        /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/
                        .exec(embed.body.color)
                        ?.map(hex => Number.parseInt(hex, 16)) ?? []
                    ne.color = red*0x010000 + green*0x000100 + blue;
                }
                
                if(embed.footer.footer.length>0){
                    ne.footer = new d.EmbedFooter(embed.footer.footer);
                    if(embed.footer.footer_icon_url.length>0) ne.footer.icon_url = embed.footer.footer_icon_url;
                }

                if(embed.image_url.length>0) ne.image = new d.EmbedImage(embed.image_url);
                if(embed.thumbnail_url.length>0) ne.thumbnail = new d.EmbedImage(embed.thumbnail_url);
                
                if(embed.author.author.length > 0) {//is required for author object
                    ne.author = new d.EmbedAuthor(embed.author.author);
                    if(embed.author.author_url.length>0) ne.author!.url = embed.author.author_url;
                    if(embed.author.author_icon_url.length>0) ne.author!.icon_url = embed.author.author_icon_url;
                }
                if(embed.fields.length>0){
                    ne.fields = embed.fields;
                }
                res.embeds?.push(ne);
            });
        }
        return res;
    }

    toJson(){//TODO check if not everything is empty somewhere else
        return JSON.stringify(this.toDiscordFormat());
    }
}
