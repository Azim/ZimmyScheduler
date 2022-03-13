import { css, html, LitElement } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import * as ec from './classes';
import * as fns from 'date-fns';
import './custom-date-time-picker';

import { createPopper } from '@popperjs/core';

import '@vaadin/text-field';
import '@vaadin/icon';
import '@vaadin/icons';
import '@vaadin/button';
import '@vaadin/details';
import '@vaadin/vertical-layout';
import '@vaadin/horizontal-layout';
import '@vaadin/checkbox';
import '@vaadin/date-time-picker';
import '@vaadin/date-picker';
import 'vanilla-colorful';

import '@polymer/paper-dialog';


@customElement('embed-editor')
export class EmbedEditor extends LitElement {
    
    private $server?: any;

    message: ec.Message = new ec.Message();

    render() {
        return html`
            <vaadin-vertical-layout>
                <vaadin-text-area
                    label="Content ${this.message.content.length}/2000"
                    minlength="0"
                    maxlength="2000"
                    value = "${this.message.content}"
                    @value-changed="${(e: CustomEvent) => {
                        this.message.content = e.detail.value;
                        this.requestUpdate();
                    }}"
                ></vaadin-text-area>
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
            <vaadin-button @click="${(e: any)  => this.$server.somethingHappened(this.message.toJson())}">Send to server logs lol</vaadin-button>
        `;
    }

    buildEmbed(embed: ec.Embed){
        var i = this.message.embeds.indexOf(embed);
        var name = this.message.embeds[i].body.title;
        return html`
        <vaadin-horizontal-layout style="align-items: flex-start" >
            <vaadin-details opened> <!-- embed -->
                <div slot="summary">
                    Embed ${i+1}${name.length>0?' - '+name:''}
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
                        label="Title ${name.length}/256"
                        minlength="0"
                        maxlength="256"
                        value = "${name}"
                        @value-changed="${(e: CustomEvent) => {
                            this.message.embeds[i].body.title = e.detail.value;
                            this.requestUpdate();
                        }}"
                    ></vaadin-text-field>
                    <vaadin-text-area
                        label="Description ${this.message.embeds[i].body.description.length}/4096"
                        minlength="0"
                        maxlength="4096"
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
                    <vaadin-horizontal-layout style="align-items: baseline" >
                        <vaadin-text-field
                            label="Color"
                            minlength="0"
                            maxlength="7"
                            value = "${this.message.embeds[i].body.color}"
                            @value-changed="${(e: CustomEvent) => {
                                this.message.embeds[i].body.color = e.detail.value;
                                this.message.embeds[i].body.hasColor = e.detail.value.length>0;
                                this.requestUpdate();
                            }}"
                        ></vaadin-text-field>
                        

                        <vaadin-button
                            id = "color-button-${i}"
                            @click = "${(e: CustomEvent) => {
                                var dialog:any = this.shadowRoot!.querySelector(`#color-dialog-${i}`);
                                dialog.open();
                            }}"
                            style = "background-color:${this.message.embeds[i].body.color}"
                        > </vaadin-button>
                        <paper-dialog id="color-dialog-${i}" no-overlap horizontal-align="left" vertical-align="top" style="margin: 0">
                            <hex-color-picker 
                                style="margin: 0; padding:0"
                                color="${this.message.embeds[i].body.color}" 
                                @color-changed="${(e: CustomEvent) => {
                                    this.applyColor(i,e.detail.value);
                                }}"
                            ></hex-color-picker>
                        </paper-dialog>

                    </vaadin-horizontal-layout>
                    
                    </vaadin-vertical-layout>
                </vaadin-details>
                <vaadin-details opened> <!-- embed fields -->
                    <div slot="summary">Fields</div>
                    <vaadin-vertical-layout>
                        ${this.message.embeds[i].fields.map((field => this.buildField(i, field)))}
                        ${this.message.embeds[i].fields.length<25?
                            html`<vaadin-button @click="${(e: any)  => {
                                this.message.embeds[i].fields.push(new ec.Field())
                                this.requestUpdate();
                            }}">Add Field</vaadin-button>`
                            : html``
                        }
                    </vaadin-vertical-layout>
                </vaadin-details>
                <vaadin-text-field
                    label="Image URL"
                    minlength="0"
                    pattern="^(?:https?:\/\/|[%{]).*"
                    value = "${this.message.embeds[i].image_url}"
                    @value-changed="${(e: CustomEvent) => {
                        this.message.embeds[i].image_url = e.detail.value;
                        this.requestUpdate();
                    }}"
                ><!-- embed image --></vaadin-text-field>

                <vaadin-details opened> <!-- embed footer -->
                    <div slot="summary">Footer</div>
                    <vaadin-vertical-layout>
                        <vaadin-text-area
                            label="Footer ${this.message.embeds[i].footer.footer.length}/2048"
                            minlength="0"
                            maxlength="2048"
                            value = "${this.message.embeds[i].footer.footer}"
                            @value-changed="${(e: CustomEvent) => {
                                this.message.embeds[i].footer.footer = e.detail.value;
                                this.requestUpdate();
                            }}"
                        ></vaadin-text-area>
                        <custom-date-time-picker
                            label="Timestamp"
                            date-placeholder="DD/MM/YYYY"
                            time-placeholder="hh:mm:ss"
                            step="1"
                            @value-changed="${(e: CustomEvent) => {
                                this.message.embeds[i].footer.timestamp = e.detail.value; //TODO proper format for input and result, local to utc conversion, check if its server time or client time
                                console.log(e.detail.value);
                                this.requestUpdate();
                            }}"
                        ></custom-date-time-picker>
                        
                        <vaadin-text-field
                            label="Footer Icon URL"
                            minlength="0"
                            pattern="^(?:https?:\/\/|[%{]).*"
                            value = "${this.message.embeds[i].footer.footer_icon_url}"
                            @value-changed="${(e: CustomEvent) => {
                                this.message.embeds[i].footer.footer_icon_url = e.detail.value;
                                this.requestUpdate();
                            }}"
                        ></vaadin-text-field>
                    </vaadin-vertical-layout>
                </vaadin-details>
            </vaadin-details>
            
        </vaadin-horizontal-layout>
        `;
    }

    applyColor(i:number, color:any){
        this.message.embeds[i].body.color = color;
        this.message.embeds[i].body.hasColor = color.length>0;
        this.requestUpdate();
    }

    buildField(i:number, field:ec.Field){
        var j = this.message.embeds[i].fields.indexOf(field);
        var name = this.message.embeds[i].fields[j].name;
        var value = this.message.embeds[i].fields[j].value;
        return html`
            <vaadin-horizontal-layout style="align-items: flex-start" >
                <vaadin-details opened>
                    <div slot="summary">
                        Field ${j+1}${name.length>0?' - '+name:''}
                        <vaadin-button theme="icon" aria-label="Remove field" @click = ${()=>{
                            this.removeField(i,j);
                            this.requestUpdate();
                        }}>
                            <vaadin-icon icon="vaadin:close-small"></vaadin-icon>
                        </vaadin-button>
                    </div>
                    <vaadin-vertical-layout>
                        <vaadin-horizontal-layout style="align-items: baseline" >
                        <vaadin-text-field
                            label="Field Name ${name.length}/256"
                            minlength="0"
                            maxlength="256"
                            value = "${name}"
                            @value-changed="${(e: CustomEvent) => {
                                this.message.embeds[i].fields[j].name = e.detail.value;
                                this.requestUpdate();
                            }}"
                        ></vaadin-text-field>

                        <vaadin-checkbox 
                            label="Inline" 
                            value = "${this.message.embeds[i].fields[j].inline}"
                            @change="${
                            (e: CustomEvent) => {
                                this.message.embeds[i].fields[j].inline = !this.message.embeds[i].fields[j].inline;
                                this.requestUpdate();
                            }}"
                        ></vaadin-checkbox>
                        </vaadin-horizontal-layout>
                        <vaadin-text-area
                            label="Field Value ${value.length}/1024"
                            minlength="0"
                            maxlength="1024"
                            value = "${value}"
                            @value-changed="${(e: CustomEvent) => {
                                this.message.embeds[i].fields[j].value = e.detail.value;
                                this.requestUpdate();
                            }}"
                        ></vaadin-text-area>
                    </vaadin-vertical-layout>
                </vaadin-details>
            </vaadin-horizontal-layout>
        `;
    }

    removeEmbed(id: number){
        this.message.embeds.splice(id,1);
    }
    removeField(i: number,j: number){
        this.message.embeds[i].fields.splice(j,1);
    }
}
