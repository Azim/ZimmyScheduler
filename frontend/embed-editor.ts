import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import * as ec from './classes';

import '@vaadin/text-field';
import '@vaadin/icon';
import '@vaadin/icons';
import '@vaadin/button';
import '@vaadin/details';
import '@vaadin/vertical-layout';
import '@vaadin/horizontal-layout';

@customElement('embed-editor')
export class EmbedEditor extends LitElement {
    
    private $server?: any;

    message: ec.Message = new ec.Message();

    render() {
        return html`
            <vaadin-vertical-layout>
                <vaadin-details opened> <!-- message author -->
                    <div slot="summary">Profile</div>
                        <vaadin-vertical-layout>
                        <vaadin-text-field
                            label="Username ${this.message.author.username.length}/80"
                            minlength="0"
                            maxlength="80"
                            value = "${this.message.author.username}"
                            @value-changed="${(e: CustomEvent) => {
                                this.message.author.username = e.detail.value;
                                this.requestUpdate();
                            }}"
                        ></vaadin-text-field>
                        <vaadin-text-field
                            label="Avatar URL"
                            minlength="0"
                            pattern="^(?:https?:\/\/|[%{]).*"
                            value = "${this.message.author.avatar_url}"
                            @value-changed="${(e: CustomEvent) => {
                                this.message.author.avatar_url = e.detail.value;
                                this.requestUpdate();
                            }}"
                        ></vaadin-text-field>
                    </vaadin-vertical-layout>
                </vaadin-details>

                ${this.message.embeds.map((embed => this.buildEmbed(embed)))}

            </vaadin-vertical-layout>
            <vaadin-button @click="${(e: any)  => {
                this.message.embeds.push(new ec.Embed());
                this.requestUpdate();
            }}">Add embed</vaadin-button>
            <vaadin-button @click="${(e: any)  => this.$server.somethingHappened(this.message)}">Send to server logs lol</vaadin-button>
        `;
    }

    buildEmbed(embed: ec.Embed){
        var i = this.message.embeds.indexOf(embed);
        return html`
        <vaadin-horizontal-layout style="align-items: flex-start" >
            <vaadin-details opened> <!-- embed -->
                <div slot="summary">
                    Embed ${i+1}
                    <vaadin-button theme="icon" aria-label="Remove embed" @click = ${()=>{
                        this.removeEmbed(i);
                        this.requestUpdate();
                    }}>
                    <vaadin-icon icon="vaadin:close-small"></vaadin-icon>
                    </vaadin-button>
                </div>
                <vaadin-details opened> <!-- embed author -->
                    <div slot="summary">Author</div>
                    <vaadin-vertical-layout>
                    <vaadin-text-field
                        label="Author ${this.message.embeds[i].author.author.length}/256"
                        minlength="0"
                        maxlength="256"
                        value = "${this.message.embeds[i].author.author}"
                        @value-changed="${(e: CustomEvent) => {
                            this.message.embeds[i].author.author = e.detail.value;
                            this.requestUpdate();
                        }}"
                    ></vaadin-text-field>
                    <vaadin-text-field
                        label="Author URL"
                        minlength="0"
                        pattern="^(?:https?:\/\/|[%{]).*"
                        value = "${this.message.embeds[i].author.author_url}"
                        @value-changed="${(e: CustomEvent) => {
                            this.message.embeds[i].author.author_url = e.detail.value;
                            this.requestUpdate();
                        }}"
                    ></vaadin-text-field>
                    <vaadin-text-field
                        label="Author Icon URL"
                        minlength="0"
                        pattern="^(?:https?:\/\/|[%{]).*"
                        value = "${this.message.embeds[i].author.author_icon_url}"
                        @value-changed="${(e: CustomEvent) => {
                            this.message.embeds[i].author.author_icon_url = e.detail.value;
                            this.requestUpdate();
                        }}"
                    ></vaadin-text-field>
                    </vaadin-vertical-layout>
                </vaadin-details>
                <vaadin-details opened> <!-- embed body -->
                    <div slot="summary">Body</div>
                    <vaadin-vertical-layout>
                    <vaadin-text-field
                        label="Title ${this.message.embeds[i].body.title.length}/256"
                        minlength="0"
                        maxlength="256"
                        value = "${this.message.embeds[i].body.title}"
                        @value-changed="${(e: CustomEvent) => {
                            this.message.embeds[i].body.title = e.detail.value;
                            this.requestUpdate();
                        }}"
                    ></vaadin-text-field>
                    <vaadin-text-area
                        label="Description ${this.message.embeds[i].body.description.length}/4096"
                        minlength="0"
                        pattern="^(?:https?:\/\/|[%{]).*"
                        value = "${this.message.embeds[i].body.description}"
                        @value-changed="${(e: CustomEvent) => {
                            this.message.embeds[i].body.description = e.detail.value;
                            this.requestUpdate();
                        }}"
                    ></vaadin-text-area>
                    <vaadin-text-field
                        label="URL"
                        minlength="0"
                        pattern="^(?:https?:\/\/|[%{]).*"
                        value = "${this.message.embeds[i].body.url}"
                        @value-changed="${(e: CustomEvent) => {
                            this.message.embeds[i].body.url = e.detail.value;
                            this.requestUpdate();
                        }}"
                    ></vaadin-text-field>
                    </vaadin-vertical-layout>
                </vaadin-details>
            </vaadin-details>
            
        </vaadin-horizontal-layout>
        `;
    }

    removeEmbed(id: number){
        this.message.embeds.splice(id,1); //TODO embeds?
    }

    buildField(id: number){
        return `
            <vaadin-horizontal-layout style="align-items: flex-start" >
                <vaadin-details opened>
                    <div slot="summary">Field ${id+1}</div>
                    <vaadin-vertical-layout>
                        <span>Sophia Williams</span>
                        <span>sophia.williams@company.com</span>
                        <span>(501) 555-9128</span>
                    </vaadin-vertical-layout>
                </vaadin-details>
                <vaadin-button theme="icon" aria-label="Remove field" @click = ${()=>{
                    //this.removeField(id);
                }}>
                    <vaadin-icon icon="vaadin:close-small"></vaadin-icon>
                </vaadin-button>
            </vaadin-horizontal-layout>
        `;
    }

    removeField(id: number){
        this.message.embeds.splice(id,1); //TODO embeds?
    }
}