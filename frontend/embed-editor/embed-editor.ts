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
import { repeat } from 'lit/directives/repeat.js';
import Message from 'Frontend/generated/icu/azim/dashboard/models/editor/Message';
import { BinderNode } from '@hilla/form/BinderNode';
import Embed from 'Frontend/generated/icu/azim/dashboard/models/editor/Embed';
import EmbedModel from 'Frontend/generated/icu/azim/dashboard/models/editor/EmbedModel';
import Field from '../generated/icu/azim/dashboard/models/editor/Field';
import FieldModel from '../generated/icu/azim/dashboard/models/editor/FieldModel';

@customElement('embed-editor')
export class EmbedEditor extends LitElement {
    
    private $server?: any;
    private binder = new Binder(
        this, 
        MessageModel, 
        {
            onChange: ()=>{
                this.requestUpdate();
            },
            onSubmit: EditorEndpoint.submitMessage
        }
    );


    //private message: ec.Message = new ec.Message();

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
        let embeds = this.binder.for(this.binder.model.embeds);
        if(!embeds.value) embeds.value = [];
        return html`
            <vaadin-vertical-layout style= "width:100%"> 
                <vaadin-text-area
                    label="Content ${this.binder.for(this.binder.model.content).value?.length??0}/2000"
                    minlength="0"
                    maxlength="2000"
                    ${field(this.binder.model.content)}
                ></vaadin-text-area>
                <vaadin-details opened> <!-- message author -->
                    <div slot="summary">Profile</div>
                        <vaadin-vertical-layout>
                        <vaadin-text-field
                            label="Username ${this.binder.for(this.binder.model.author.username).value?.length??0}/80"
                            minlength="0"
                            maxlength="80"
                            ${field(this.binder.model.author.username)}
                        ></vaadin-text-field>
                        <vaadin-text-field
                            label="Avatar URL"
                            minlength="0"
                            error-message="Invalid url format"
                            ${field(this.binder.model.author.avatarUrl)}
                        ></vaadin-text-field>
                    </vaadin-vertical-layout>
                </vaadin-details>

                ${repeat(this.binder.model.embeds, b => this.buildEmbed(b))}

                <vaadin-button @click="${(e: any)  => {
                    this.binder.for(this.binder.model.embeds).appendItem();
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
                <vaadin-button 
                    ?disabled="${this.binder.invalid || this.binder.submitting}"
                    @click="${(e: any)  => {
                        //EditorEndpoint.test();
                        //this.$server.somethingHappened(this.message.toJson());
                        this.binder.submit();
                    }
                }">
                    ${(this.sendNow?'Send':'Save')+'(not really)'}
                </vaadin-button>
                <a target="_blank" href="${
                    //this.message.toDiscohook()
                    ''
                }">
                    <vaadin-button>Show in discohook</vaadin-button>
                </a>
            </vaadin-vertical-layout>
            <vaadin-vertical-layout style= "width:100%">
                <!--{this.message.toPreview()}-->
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

    buildEmbed(embedBinder: BinderNode<Embed, EmbedModel<Embed>>) {
        let embeds = this.binder.for(this.binder.model.embeds).value;
        let e = embedBinder.value;
        let i = embeds && e ? embeds.indexOf(e) : -1;
        if(i<0) throw new Error('Embed not found');
        let name = embedBinder.value?.body?.title??'';
        let color = embedBinder.value?.body?.color;
        if(!validators.isHexColor(color??'')) color = undefined;

        let fields = embedBinder.for(embedBinder.model.fields);
        if(!fields.value) fields.value = [];

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
                        @click = ${()=> embedBinder.removeSelf()}
                        style="background: transparent; margin: 0;"
                    >
                        <vaadin-icon icon="vaadin:close-small" style="color: var(--lumo-secondary-text-color);"></vaadin-icon>
                    </vaadin-button>
                </div>
                <vaadin-details opened class="first-detail">
                    <div slot="summary">Author</div>
                    <vaadin-vertical-layout>
                        <vaadin-text-field
                            label="Author ${embedBinder.for(embedBinder.model.author.author).value?.length??0}/256"
                            minlength="0"
                            maxlength="256"
                            ${field(embedBinder.model.author.author)}
                        ></vaadin-text-field>
                        <vaadin-text-field
                            label="Author URL"
                            minlength="0"
                            ${field(embedBinder.model.author.authorUrl)}
                        ></vaadin-text-field>
                        <vaadin-text-field
                            label="Author Icon URL"
                            minlength="0"
                            ${field(embedBinder.model.author.authorIconUrl)}
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
                            ${field(embedBinder.model.body.title)}
                        ></vaadin-text-field>
                        <vaadin-text-area
                            label="Description ${embedBinder.for(embedBinder.model.body.description).value?.length??0}/4096"
                            minlength="0"
                            maxlength="4096"
                            ${field(embedBinder.model.body.description)}
                        ></vaadin-text-area>
                        <vaadin-text-field
                            label="URL"
                            minlength="0"
                            ${field(embedBinder.model.body.url)}
                        ></vaadin-text-field>
                        <vaadin-horizontal-layout style="align-items: baseline" >
                            <vaadin-text-field
                                label="Color"
                                minlength="0"
                                maxlength="7"
                                placeholder="#rrggbb"
                                ${field(embedBinder.model.body.color)}
                                clear-button-visible
                            ></vaadin-text-field>
                            <vaadin-button
                                id = "color-button-${i}"
                                @click = "${(e: CustomEvent) => {
                                    let dialog:any = this.shadowRoot!.querySelector(`#color-dialog-${i}`);
                                    dialog.positionTarget = e.currentTarget;
                                    dialog.open();
                                }}"
                                style = "background-color:${color??'rgb(32, 34, 37)'}; min-width: var(--lumo-button-size);"
                                theme = "icon"
                            >
                                <vaadin-icon icon="vaadin:eyedropper" style="padding-left: 0;"></vaadin-icon>
                            </vaadin-button>
                            <paper-dialog id="color-dialog-${i}" no-overlap horizontal-align="right" vertical-align="top" style="margin: 0;border-radius: 8px 8px 8px 8px;">
                                <hex-color-picker 
                                    style="margin: 0; padding:0"
                                    color="${color??'#rrggbb'}" 
                                    @color-changed="${(e: CustomEvent) => {
                                        embedBinder.for(embedBinder.model.body.color).value = e.detail.value;
                                    }}"
                                ></hex-color-picker>
                            </paper-dialog>
                        </vaadin-horizontal-layout>
                    </vaadin-vertical-layout>
                </vaadin-details>
                <vaadin-details opened class="first-btn-detail">
                    <div slot="summary">Fields</div>
                    <vaadin-vertical-layout>
                        ${repeat(embedBinder.model.fields, f => this.buildField(embedBinder, f))}
                        ${embeds?.length??0<25?
                            html`<vaadin-button @click="${(e: any)  => {
                                embedBinder.for(embedBinder.model.fields).appendItem();
                            }}">Add Field</vaadin-button>`
                            : html``
                        }
                    </vaadin-vertical-layout>
                </vaadin-details>
                <vaadin-text-field
                    label="Image URL"
                    minlength="0"
                    ${field(embedBinder.model.imageUrl)}
                ></vaadin-text-field>

                <vaadin-details opened>
                    <div slot="summary">Footer</div>
                    <vaadin-vertical-layout>
                        <vaadin-text-area
                            label="Footer ${embedBinder.for(embedBinder.model.footer.footer).value?.length??0}/2048"
                            minlength="0"
                            maxlength="2048"
                            ${field(embedBinder.model.footer.footer)}
                        ></vaadin-text-area>
                        <vaadin-date-time-picker
                            label="Timestamp"
                            date-placeholder="DD.MM.YYYY"
                            time-placeholder="hh:mm"
                            step="${60*5}"

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
                                //TODO type?
                                //let d:Date = new Date(e.detail.value);
                                //this.message.embeds[i].footer.timestamp = d.toISOString(); 
                                this.requestUpdate();
                            }}"
                        ></vaadin-date-time-picker>
                        
                        <vaadin-text-field
                            label="Footer Icon URL"
                            minlength="0"
                            ${field(embedBinder.model.footer.footerIconUrl)}
                        ></vaadin-text-field>
                    </vaadin-vertical-layout>
                </vaadin-details>
            </vaadin-details>
            
        </vaadin-horizontal-layout>
        `;
    }
    buildField(embedBinder: BinderNode<Embed, EmbedModel<Embed>>, fieldBinder: BinderNode<Field, FieldModel<Field>>) {
        
        console.log("field start");
        let fields = embedBinder.for(embedBinder.model.fields).value;
        let f = fieldBinder.value;
        let j = fields && f ? fields.indexOf(f) : -1;
        if(j<0) throw new Error('Field not found');

        let name = fieldBinder.value?.name??'';
        let value = fieldBinder.value?.value??'';
        console.log("field end");

        return html`
            <vaadin-horizontal-layout style="align-items: flex-start; width:100%;" >
                <vaadin-details opened class="btn-detail">
                    <div slot="summary">
                        Field ${j+1}${name.length>0?' - '+name:''}
                        <vaadin-button 
                            theme="icon" 
                            aria-label="Remove field" 
                            @click = ${()=>{
                                fieldBinder.removeSelf();
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
                            ${field(fieldBinder.model.name)}
                            ></vaadin-text-field>

                            <vaadin-checkbox 
                                label="Inline" 
                                ${field(fieldBinder.model.inline)}
                            ></vaadin-checkbox>
                        </vaadin-horizontal-layout>
                        <vaadin-text-area
                            label="Field Value ${value.length}/1024"
                            minlength="0"
                            maxlength="1024"
                            ${field(fieldBinder.model.value)}
                        ></vaadin-text-area>
                    </vaadin-vertical-layout>
                </vaadin-details>
            </vaadin-horizontal-layout>
        `;
    }
}
