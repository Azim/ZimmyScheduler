import { css, html, LitElement } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import * as ec from './classes';
import * as fns from 'date-fns';
import * as validators from './validators';
import {readableExpressionLabel} from '../quartz-cron/quartz-cron';

import '../quartz-cron/quartz-cron';

import '@vaadin/icon';
import '@vaadin/icons';

import '@vaadin/text-area';
import '@vaadin/text-field';
import '@vaadin/integer-field';
import '@vaadin/password-field';

import '@vaadin/button';
import '@vaadin/details';
import '@vaadin/vertical-layout';
import '@vaadin/horizontal-layout';
import '@vaadin/checkbox';
import '@vaadin/date-time-picker';
import '@vaadin/date-picker';
import '@vaadin/select';
import 'vanilla-colorful';

import '@skyra/discord-components-core';
import { defineCustomElements } from "@skyra/discord-components-core/loader";

import '@polymer/paper-dialog';
import { DateTimePicker } from '@vaadin/date-time-picker';
import { DatePickerDate } from '@vaadin/date-picker';
import { TimePickerTime } from '@vaadin/time-picker/src/vaadin-time-picker';

import { EditorEndpoint } from 'Frontend/generated/endpoints';
import MessageModel from 'Frontend/generated/icu/azim/dashboard/models/editor/MessageModel';
import { Binder, field } from '@hilla/form';
import Message from 'Frontend/generated/icu/azim/dashboard/models/editor/Message';

@customElement('embed-editor')
export class EmbedEditor extends LitElement {
    
    private $server?: any;
    private binder = new Binder(
        this, 
        MessageModel, 
        {
            onChange: ()=>{

            },
            onSubmit: EditorEndpoint.submitMessage
        }
    );


    private message: ec.Message = new ec.Message();

    private webhook:string = '';
    private sendTime:string = '';
    private selectedType:string='once';
    private repeatMinutes:string = '30';
    private repeatCron:string = '';
    private sendNow:boolean = false;
    
    public user_expression:string = '0 0 0 ? * * *';

    constructor(){
        super();
        defineCustomElements();
    }

    private repeatTypes = [
        {
            label: 'once',
            value: 'once',
        },
        {
            label: 'each X minutes',
            value: 'minutes',
        },
        {
            label: 'according to cron expression',
            value: 'cron',
        }
    ];

    static styles = css`
        vaadin-text-area, vaadin-text-field, vaadin-password-field, vaadin-details{
            width:100%;
        }
        
        :host{
            width:100%;
            display:flex;
            flex-direction:row;
            align-items:flex-start;
            box-sizing: border-box;
            padding: 1em;
        }
        
        .hidden{
            display: none;
        }

        .discord-message, .discord-messages, .discord-embed, .discord-embed-wrapper, .discord-embed-grid {
            width:100%;
            box-sizing: border-box;
        }
        .discord-message {
            padding-right: 0 !important;
        }
        .discord-embed .discord-embed-description{
            white-space: inherit;
        }

        .d-spoiler {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
        }

    `;

    render() {
        return html`
            <vaadin-vertical-layout style= "width:100%"> 
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
                            error-message="Invalid url format"
                        ></vaadin-text-field>
                    </vaadin-vertical-layout>
                </vaadin-details>

                ${this.message.embeds.map((embed => this.buildEmbed(embed)))}

                <vaadin-button @click="${(e: any)  => {
                    this.message.embeds.push(new ec.Embed());
                    this.requestUpdate();
                }}">Add embed</vaadin-button>
                
                <vaadin-password-field 
                    label="Webhook url"
                    pattern = "^https?:\/\/(?:www\.|ptb\.|canary\.)?discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/\d+\/[\w-]+$"
                    error-message="Invalid webhook url"
                    @value-changed="${(e: CustomEvent) => {
                        this.webhook = e.detail.value;
                    }}"
                ></vaadin-password-field>
                
                <vaadin-select
                    style="width:16.5em;"
                    label="Send message"
                    .items="${this.repeatTypes}"
                    .value="${this.repeatTypes[0].value}"
                    @value-changed="${(e: CustomEvent) => {
                        this.selectedType = e.detail.value;
                        this.requestUpdate();
                    }}"
                ></vaadin-select>

                ${this.buildChoice()}
                <vaadin-button @click="${(e: any)  => {
                    EditorEndpoint.test();
                    //this.$server.somethingHappened(this.message.toJson());
                }
                }">${(this.sendNow?'Send':'Save')+'(not really)'}</vaadin-button>
                <a target="_blank" href="${this.message.toDiscohook()}">
                    <vaadin-button>Show in discohook</vaadin-button>
                </a>
            </vaadin-vertical-layout>
            <vaadin-vertical-layout style= "width:100%">
                ${this.message.toPreview()}
            </vaadin-vertical-layout>
        `;
    }


    buildChoice(){
        let dateChangeListener = (e: CustomEvent) => {
            if(!e.detail.value){
                let picker: DateTimePicker = e.currentTarget as DateTimePicker;
                
                picker.i18n.formatDate = (dateParts: DatePickerDate): string => {
                    const { year, month, day } = dateParts;
                    const date = new Date(year, month, day);
                    return fns.format(date, 'dd.MM.yyyy');
                };
                picker.i18n.parseDate = (inputValue: string): DatePickerDate => {
                    const date = fns.parse(inputValue, 'dd.MM.yyyy', new Date());
                    return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() };
                };
                picker.i18n.formatTime = (dateParts: TimePickerTime): string => {
                    const {hours, minutes, seconds } = dateParts;
                    const pad = (num:string|number, fmt='00') => (fmt+num).substring((fmt+num).length - fmt.length);
                    let timeString = `${pad(hours)}:${pad(minutes)}:${pad(seconds?seconds:0)}`
                    return timeString;
                };
                this.requestUpdate();
                return;
            }
            let d:Date = new Date(e.detail.value);
            this.sendTime = d.toISOString(); 
            this.requestUpdate();
        };

        return html`
            <vaadin-integer-field 
                class="${ifDefined(this.selectedType=='minutes'?undefined:'hidden')}"
                label="X:"
                value="${this.repeatMinutes}" 
                min="30" 
                max="43800"
                @value-changed="${ (e: CustomEvent) => (this.repeatMinutes = e.detail.value) }"
                error-message="At least 30"
            ></vaadin-integer-field>

            <div class="${ifDefined(this.selectedType=='cron'?undefined:'hidden')}" style="width:100%;">
                <vaadin-text-field
                    id="user-cron-input"
                    .value="${this.user_expression}"
                    @value-changed="${(e: CustomEvent) =>{
                        this.user_expression = e.detail.value.trim();
                        this.requestUpdate();
                    }}"
                >
                    ${readableExpressionLabel(this.user_expression)}
                    <div slot="helper">
                        <a target="_blank" href="https://www.freeformatter.com/cron-expression-generator-quartz.html#cronexpressionexamples" style="color: rgb(0, 176, 244);text-decoration: none;">Quartz cron expression</a>
                    </div>
                </vaadin-text-field> 
                <quartz-cron
                    @value-changed="${ (e: CustomEvent) => {
                        console.log('quartz-cron',e);
                    }}"
                ></quartz-cron>
            </div>

            <vaadin-horizontal-layout style="align-items: baseline" >
                <vaadin-date-time-picker
                    label="Starting at"
                    date-placeholder="DD.MM.YYYY"
                    time-placeholder="hh:mm:ss"
                    step="${60*15}"
                    .disabled=${this.sendNow}
                    value = "${this.sendTime}"
                    @value-changed="${dateChangeListener}"
                ></vaadin-date-time-picker>
                <vaadin-checkbox 
                    label="Right away"
                    .checked=${this.sendNow}
                    @checked-changed="${(e: CustomEvent) => {
                        this.sendNow = e.detail.value;
                        this.requestUpdate();
                    }}"
                ></vaadin-checkbox>
            </vaadin-horizontal-layout> 
        `;
        
    }

    buildEmbed(embed: ec.Embed){
        let i = this.message.embeds.indexOf(embed);
        let name = this.message.embeds[i].body.title;
        let color:any = this.message.embeds[i].body.color;
        if(color.length==0||!validators.isHexColor(color)) color = undefined;

        return html`
        <vaadin-horizontal-layout style="align-items: flex-start; width: 100%;" class="embed-edit">
            <vaadin-details 
                opened
                style="--embed-edit-border-color: ${ifDefined(color)};"
                class="btn-detail"
            >
                <div slot="summary">
                    Embed ${i+1}${name.length>0?' - '+name:''}
                    <vaadin-button 
                        theme="icon" 
                        aria-label="Remove embed" 
                        @click = ${()=>{
                            this.removeEmbed(i);
                            this.requestUpdate();
                        }}
                        style="background: transparent; margin: 0;"
                    >
                        <vaadin-icon icon="vaadin:close-small" style="color: var(--lumo-secondary-text-color);"></vaadin-icon>
                    </vaadin-button>
                </div>
                <vaadin-details opened class="first-detail">
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
                <vaadin-details opened> 
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
                            placeholder="#rrggbb"
                            value = "${this.message.embeds[i].body.color}"
                            @value-changed="${(e: CustomEvent) => {
                                if(validators.isHexColor(e.detail.value)||e.detail.value.length==0){
                                    this.message.embeds[i].body.color = e.detail.value;
                                }
                                this.requestUpdate();
                            }}"
                            clear-button-visible
                        ></vaadin-text-field>
                        
                        <vaadin-button
                            id = "color-button-${i}"
                            @click = "${(e: CustomEvent) => {
                                let dialog:any = this.shadowRoot!.querySelector(`#color-dialog-${i}`);
                                dialog.positionTarget = e.currentTarget;
                                dialog.open();
                            }}"
                            style = "background-color:${validators.isHexColor(this.message.embeds[i].body.color)?this.message.embeds[i].body.color:'rgb(32, 34, 37)'}; min-width: var(--lumo-button-size);"
                            theme = "icon"
                        >
                            <vaadin-icon icon="vaadin:eyedropper" style="padding-left: 0;"></vaadin-icon>
                        </vaadin-button>

                        <paper-dialog id="color-dialog-${i}" no-overlap horizontal-align="right" vertical-align="top" style="margin: 0;border-radius: 8px 8px 8px 8px;">
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
                <vaadin-details opened class="first-btn-detail">
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
                ></vaadin-text-field>

                <vaadin-details opened>
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
                        <vaadin-date-time-picker
                            label="Timestamp"
                            date-placeholder="DD.MM.YYYY"
                            time-placeholder="hh:mm"
                            step="60*5"

                            @value-changed="${(e: CustomEvent) => {
                                if(!e.detail.value) {
                                    let picker: DateTimePicker = e.currentTarget as DateTimePicker;
                                    picker.i18n.formatDate = (dateParts: DatePickerDate): string => {
                                        const { year, month, day } = dateParts;
                                        const date = new Date(year, month, day);
                                        return fns.format(date, 'dd.MM.yyyy');
                                    };
                                    picker.i18n.parseDate = (inputValue: string): DatePickerDate => {
                                        const date = fns.parse(inputValue, 'dd.MM.yyyy', new Date());
                                        return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() };
                                    };
                                    return;
                                }
                                let d:Date = new Date(e.detail.value);
                                this.message.embeds[i].footer.timestamp = d.toISOString(); 
                                this.requestUpdate();
                            }}"
                        ></vaadin-date-time-picker>
                        
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
        if(color.length<7) return; //not sure how but on init it gives #000 :concern:
        this.message.embeds[i].body.color = color;
        this.requestUpdate();
    }

    buildField(i:number, field:ec.Field){
        let j = this.message.embeds[i].fields.indexOf(field);
        let name = this.message.embeds[i].fields[j].name;
        let value = this.message.embeds[i].fields[j].value;
        return html`
            <vaadin-horizontal-layout style="align-items: flex-start; width:100%;" >
                <vaadin-details opened class="btn-detail">
                    <div slot="summary">
                        Field ${j+1}${name.length>0?' - '+name:''}
                        <vaadin-button 
                            theme="icon" 
                            aria-label="Remove field" 
                            @click = ${()=>{
                                this.removeField(i,j);
                                this.requestUpdate();
                            }}
                            style="background: transparent; margin: 0;"
                        >
                            <vaadin-icon icon="vaadin:close-small" style="color: var(--lumo-secondary-text-color);"></vaadin-icon>
                        </vaadin-button>
                    </div>
                    <vaadin-vertical-layout>
                        <vaadin-horizontal-layout style="align-items: baseline; width:100%;" >
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
                                .checked = "${this.message.embeds[i].fields[j].inline}"
                                @checked-changed="${(e: CustomEvent) => {
                                    this.message.embeds[i].fields[j].inline = e.detail.value;
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
