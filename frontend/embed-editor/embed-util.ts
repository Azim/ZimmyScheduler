import { HTMLOptions, htmlTag, markdownEngine, rulesEmbed, toHTML } from "discord-markdown";
import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined";
import { unsafeHTML } from "lit/directives/unsafe-html";
import Embed from "./models/Embed";
import Field from "./models/Field";
import Message from "./models/Message";


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

export function embedPreview(msg:Message){
    let getInlineIndex = (embed:Embed, field:Field)=>{
        let index = embed.fields.indexOf(field);
        return (index%3)+1;
    }

    let test = (content:string|undefined) => {
        if(!content) return undefined;
        return content.length==0?undefined:content;
    }
    let testStyle = (content:string|undefined) =>{
        if(!content) return 'margin-top:0';
        return content.length==0?'margin-top:0':undefined;
    }

    return html`
        <discord-messages>
            <discord-message 
                author="${test(msg.username)??'Webhook username'}" 
                avatar="${test(msg.avatar_url)??'https://cdn.discordapp.com/attachments/654503812593090602/665721752277483540/red.png'}" 
            bot>
                ${unsafeHTML(toHTML(msg.content??'', parseoptions, parser, out))}
                ${msg.embeds.map(embed=>{
                    if(!embed) return html``;

                    return html`
                        <discord-embed
                            slot="embeds"
                            author-image="${ifDefined(test(embed.author?.icon_url))}"
                            author-name="${ifDefined(test(embed.author?.name))}"
                            author-url="${ifDefined(test(embed.author?.url))}"
                            color="${ifDefined(numberToHexColor(embed.color))}"
                            embed-title="${ifDefined(test(embed.title))}"
                            image="${ifDefined(test(embed.image?.url))}"
                            thumbnail="${ifDefined(test(embed.thumbnail?.url))}"
                            url="${ifDefined(test(embed.url))}"
                        >
                            <discord-embed-description 
                                slot="description" 
                                style="${ifDefined(testStyle(embed.description))}"
                            >
                                <div>${unsafeHTML(toHTML(embed.description??'', parseoptions, parser, out))}</div>
                            </discord-embed-description>
                            <discord-embed-fields 
                                slot="fields" 
                                style="${ifDefined(embed.fields.length==0?'margin-top:0':undefined)}"
                            >
                                ${embed.fields.map(field=>{
                                    if(!field) return ``;
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
                                footer-image="${ifDefined(embed.footer?.icon_url)}" 
                                timestamp="${ifDefined(embed.timestamp)}"
                                style="${ifDefined((embed.footer?.text??'').length+(embed.timestamp??'').length == 0 ?'margin-top:0':undefined)}"
                            >
                                <div>${unsafeHTML(toHTML(embed.footer?.text??'', parseoptions, parser, out))}</div>
                            </discord-embed-footer>
                        </discord-embed>
                    `;
                })}
            </discord-message>
        </discord-messages>
    `;
}

export function toDiscohook(msg:Message){
    let obj = {
        messages: [
            {
                data: msg
            }
        ]
    }
    return 'https://discohook.org/?message='+btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

export function hexToNumberColor(color:string){
    const [, red = 0, green = 0, blue = 0] =
    /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/
    .exec(color.toLowerCase())
    ?.map(hex => Number.parseInt(hex, 16)) ?? []
    return red*0x010000 + green*0x000100 + blue;
}

export function numberToHexColor(color:number|undefined){
    if(!color) return undefined;

    let f = (c:number) => {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    };
    
    let blue = color%256;
    let green = (color%(256*256) - blue)/256;
    let red = (color - green*256 - blue)/(256*256);

    return '#'+f(red)+f(green)+f(blue);
}
