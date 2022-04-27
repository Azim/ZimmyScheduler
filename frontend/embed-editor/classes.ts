import * as d from './discord-classes';
import * as validators from './validators';
import '@skyra/discord-components-core';
import { css, html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { HTMLOptions, toHTML, rulesEmbed, markdownEngine } from 'discord-markdown';
import { htmlTag } from 'simple-markdown';

//discord markdown
const updatedRules = Object.assign({}, rulesEmbed, {
    discordUser: {
        order: markdownEngine.defaultRules.strong.order,
        match: (source: string) => /^<@!?([0-9]*)>/.exec(source),
        parse: function(capture: any[]) {
            return {
                id: capture[1]
            };
        },
        html: function(node: any, output: any, state: any) {
            return htmlTag('discord-mention', state.discordCallback.user(node), { }, state);
        }
    },
    discordChannel: {
        order: markdownEngine.defaultRules.strong.order,
        match: (source: string) => /^<#?([0-9]*)>/.exec(source),
        parse: function(capture: any[]) {
            return {
                id: capture[1]
            };
        },
        html: function(node: any, output: any, state: any) {
            return htmlTag('discord-mention', state.discordCallback.channel(node), { type: 'channel' }, state);
        }
    },
    discordRole: {
        order: markdownEngine.defaultRules.strong.order,
        match: (source: string) => /^<@&([0-9]*)>/.exec(source),
        parse: function(capture: any[]) {
            return {
                id: capture[1]
            };
        },
        html: function(node: any, output: any, state: any) {
            return htmlTag('discord-mention', state.discordCallback.role(node), { type: 'role' }, state);
        }
    },
    discordEmoji: {
        order: markdownEngine.defaultRules.strong.order,
        match: (source: string) => /^<(a?):(\w+):(\d+)>/.exec(source),
        parse: function(capture: any[]) {
            return {
                animated: capture[1] === 'a',
                name: capture[2],
                id: capture[3],
            };
        },
        html: function(node: { name: any; id: any; animated: any; }, output: any, state: boolean) {
            return htmlTag('discord-custom-emoji', '', {
                name: node.name,
                url: `https://cdn.discordapp.com/emojis/${node.id}.${node.animated ? 'gif' : 'png'}`
            }, state);
        }
    },
    discordEveryone: {
        order: markdownEngine.defaultRules.strong.order,
        match: (source: string) => /^@everyone/.exec(source),
        parse: function() {
            return { };
        },
        html: function(node: any, output: any, state: any) {
            return htmlTag('discord-mention', state.discordCallback.everyone(node), { }, state);
        }
    },
    discordHere: {
        order: markdownEngine.defaultRules.strong.order,
        match: (source: string) => /^@here/.exec(source),
        parse: function() {
            return { };
        },
        html: function(node: any, output: any, state: any) {
            return htmlTag('discord-mention', state.discordCallback.here(node), {  }, state);
        }
    }
});
///@ts-ignore
const parser = markdownEngine.parserFor(updatedRules);
const out = markdownEngine.outputFor(updatedRules, 'html');
const discordCallback = {
    user: (node: any) => 'user',
    channel: (node: any) => 'channel',
    role: (node: any) => 'role',
    everyone: () => 'everyone',
    here: () => 'here'
};
const parseoptions:HTMLOptions = {embed:true, escapeHTML:true, discordCallback:discordCallback};

export class Field{
    name: string = '';
    value: string = '';
    inline: boolean = false;
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
        let obj = {
            messages: [
                {
                    data: JSON.parse(this.toJson())
                }
            ]
        }
        return 'https://discohook.org/?message='+btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    }

    toPreview(){
        let getInlineIndex = (embed:Embed, field:Field)=>{
            let index = embed.fields.indexOf(field);
            return (index%3)+1;
        }
        return html`
            <discord-messages>
                <discord-message 
                    author="${this.author.username.length>0?this.author.username:'Webhook username'}" 
                    avatar="${this.author.avatar_url.length>0?this.author.avatar_url:'https://cdn.discordapp.com/attachments/654503812593090602/665721752277483540/red.png'}" 
                bot>
                    ${unsafeHTML(toHTML(this.content, parseoptions, parser, out))}
                    ${this.embeds.map(embed=>{
                        return html`
                            <discord-embed
                                slot="embeds"
                                author-image="${ifDefined(embed.author.author_icon_url.length==0?undefined:embed.author.author_icon_url)}"
                                author-name="${ifDefined(embed.author.author.length==0?undefined:embed.author.author)}"
                                author-url="${ifDefined(embed.author.author_url.length==0?undefined:embed.author.author_url)}"
                                color="${embed.body.color}"
                                embed-title="${ifDefined(embed.body.title.length==0?undefined:embed.body.title)}"
                                image="${ifDefined(embed.image_url.length==0?undefined:embed.image_url)}"
                                thumbnail="${ifDefined(embed.thumbnail_url.length==0?undefined:embed.thumbnail_url)}"
                                url="${ifDefined(embed.body.url.length==0?undefined:embed.body.url)}"
                            >
                                <discord-embed-description 
                                    slot="description" 
                                    style="${ifDefined(embed.body.description.length==0?'margin-top:0':undefined)}"
                                >
                                    <div>${unsafeHTML(toHTML(embed.body.description, parseoptions, parser, out))}</div>
                                </discord-embed-description>
                                <discord-embed-fields 
                                    slot="fields" 
                                    style="${ifDefined(embed.fields.length==0?'margin-top:0':undefined)}"
                                >
                                    ${embed.fields.map(field=>{
                                        return html`
                                            <discord-embed-field ?inline=${field.inline} inline-index="${getInlineIndex(embed, field)}">
                                                <div class="discord-field-title">${unsafeHTML(toHTML(field.name, parseoptions, parser, out))}</div>
                                                <div>${unsafeHTML(toHTML(field.value, parseoptions, parser, out))}</div>
                                            </discord-embed-field>
                                        `;
                                    })}
                                </discord-embed-fields>
                                <discord-embed-footer 
                                    slot="footer" 
                                    footer-image="${embed.footer.footer_icon_url}" 
                                    timestamp="${embed.footer.timestamp}"
                                    style="${ifDefined(embed.footer.footer.length+embed.footer.timestamp.length == 0 ?'margin-top:0':undefined)}"
                                >
                                    <div>${unsafeHTML(toHTML(embed.footer.footer, parseoptions, parser, out))}</div>
                                </discord-embed-footer>
                            </discord-embed>
                        `;
                    })}
                </discord-message>
            </discord-messages>
        `;

    }

    toDiscordFormat(){
        let res = new d.WebhookMessage();
        if(this.content.length>0) res.content = this.content;
        if(this.author.username.length>0) res.username = this.author.username;
        if(this.author.avatar_url.length>0) res.avatar_url = this.author.avatar_url;
        if(this.embeds.length>0){
            res.embeds = [];
            this.embeds.forEach(embed => {
                let ne: d.Embed = new d.Embed();
                
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
