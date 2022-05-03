import { css, html, LitElement } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import * as fns from 'date-fns';
import * as validators from './validators';
import * as eUtils from './embed-util';
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
import { Notification, NotificationOpenedChangedEvent } from '@vaadin/notification';
import { TextArea } from '@vaadin/text-area';

import '@skyra/discord-components-core';
import { defineCustomElements } from "@skyra/discord-components-core/loader";

import '@polymer/paper-dialog';
import { DateTimePicker } from '@vaadin/date-time-picker';
import { DatePickerDate } from '@vaadin/date-picker';
import { TimePickerTime } from '@vaadin/time-picker/src/vaadin-time-picker';

import { EditorEndpoint } from 'Frontend/generated/endpoints';
import { Binder, field } from '@hilla/form';
import { repeat } from 'lit/directives/repeat.js';
import { BinderNode } from '@hilla/form/BinderNode';
import MessageModel from './models/MessageModel';
import EmbedModel from './models/EmbedModel';
import Embed from './models/Embed';
import Field from './models/Field';
import FieldModel from './models/FieldModel';
import { ja } from 'date-fns/locale';

@customElement('embed-editor')
export class EmbedEditor extends LitElement {
    
    private $server?: any;
    private binder = new Binder(
        this, 
        MessageModel, 
        {
            onChange: ()=>{
                this.requestUpdate(); //redraw preview and stuff
            },
            onSubmit: EditorEndpoint.submitMessage //TODO try to send from client if applicable
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
        setInterval(()=>{
            this.binder.validate();
            for(let i = 0; i<this.binder.value.embeds.length; i++){
                //this.binder.
            }
        },500)
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

        .discord-messages {
            border-width: 0;
        }

        :host{
            /* general styles thing */
            width:100%;
            display:flex;
            flex-direction:row;
            align-items:flex-start;
            box-sizing: border-box;

            /* scroll */
            max-height: calc(100%);
            height: calc(100%);
            overflow: hidden;
        }

        .scroller {
            overflow-y: scroll;
            box-sizing: border-box;
            height: 100%;
            padding: 1em;
        }

        ::-webkit-scrollbar {
            height: 16px;
            width: 16px;
        }
        ::-webkit-scrollbar-corner {
            background-color: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background-color: rgb(32, 34, 37);
            border: 4px solid transparent;
            border-radius: 8px;
            min-height: 40px;
            background-clip: padding-box;
        }
        ::-webkit-scrollbar-track {
            background-color: rgb(46, 51, 56);
            border: 4px solid transparent;
            border-radius: 8px;
            margin-bottom: 8px;
            background-clip: padding-box;
        }

        #json-editor > textarea {
            font-family: Consolas;
            font-weight: normal;
        }

        .hl {
            width: 100%;
            height: 1px;
            background: rgba(255, 255, 255, 0.06);
            margin-bottom: 1em;
        }
    `;

    render() {
        return html`
            <vaadin-vertical-layout style= "width:100%;" class="scroller"> 
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
                            label="Username ${this.binder.for(this.binder.model.username).value?.length??0}/80"
                            minlength="0"
                            maxlength="80"
                            ${field(this.binder.model.username)}
                        ></vaadin-text-field>
                        <vaadin-text-field
                            label="Avatar URL"
                            pattern = "^(?:https?:\/\/|[%{])"
                            error-message="Invalid url format"
                            ${field(this.binder.model.avatar_url)}
                        ></vaadin-text-field>
                    </vaadin-vertical-layout>
                </vaadin-details>

                ${repeat(this.binder.model.embeds, b => this.buildEmbed(b))}

                <vaadin-button @click="${(e: any)  => {
                    console.log('creating embed');
                    this.binder.for(this.binder.model.embeds).appendItem();
                    console.log('created embed');
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
                    ?disabled="${(this.binder.invalid || this.binder.submitting) &&false}"
                    @click="${(e: any)  => {
                        //EditorEndpoint.test();
                        //this.$server.somethingHappened(this.message.toJson());
                        this.binder.submit();
                    }
                }">
                    ${(this.sendNow?'Send':'Save')+'(not really)'}
                </vaadin-button>
                <a target="_blank" href="${
                    eUtils.toDiscohook(this.binder.value)
                }">
                    <vaadin-button>Show in discohook</vaadin-button>
                </a>
            </vaadin-vertical-layout>
            <vaadin-vertical-layout style= "width:100%;" class="scroller">
                ${eUtils.embedPreview(this.binder.value)}
                <div class="hl"></div>
                <vaadin-text-area
                    label="Json editor (readonly for now)"
                    .value = "${JSON.stringify(this.binder.value, undefined, 2)}"
                    id="json-editor"
                    error-message="Invalid JSON"
                    @value-changed = "${(e:any)=>{
                        let j:TextArea|null = this.shadowRoot!.querySelector<TextArea>(`#json-editor`);
                        if(!j) return;
                        try {
                            JSON.parse(j.value);
                            j.invalid = false;
                        } catch (e:any) {
                            j.invalid = true;
                        }
                    }}"
                ></vaadin-text-area>
                <vaadin-horizontal-layout>
                    <vaadin-button 
                        ?disabled="${this.shadowRoot!.querySelector<TextArea>(`#json-editor`)?.invalid ?? false}"
                        style="margin-right:0.5em;"
                        
                        @click="${(e: any)  => {
                            let j:any = this.shadowRoot!.querySelector<TextArea>(`#json-editor`);
                            this.binder.value = JSON.parse(j.value);
                        }
                    }">Apply</vaadin-button>
                    <vaadin-button 
                        ?disabled="${false}"
                        @click="${(e: any)  => {
                            let j:any = this.shadowRoot!.querySelector<TextArea>(`#json-editor`);
                            navigator.clipboard.writeText(j.value);
                            Notification.show('Copied to clipboard', {
                                position: 'bottom-end',
                                duration: 2500,
                                theme: 'primary'
                            });
                        }
                    }">Copy to clipboard</vaadin-button>
                </vaadin-horizontal-layout>
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
        let name = embedBinder.value?.title??'';
        let color = eUtils.numberToHexColor(embedBinder.value?.color);

        if(!validators.isHexColor(color??'')) color = undefined;

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
                        @click = "${()=> embedBinder.removeSelf()}"
                        style="background: transparent; margin: 0;"
                    >
                        <vaadin-icon icon="vaadin:close-small" style="color: var(--lumo-secondary-text-color);"></vaadin-icon>
                    </vaadin-button>
                </div>
                <vaadin-details opened class="first-detail">
                    <div slot="summary">Author</div>
                    <vaadin-vertical-layout>
                        <vaadin-text-field
                            label="Author ${embedBinder.for(embedBinder.model.author.name).value?.length??0}/256"
                            minlength="0"
                            maxlength="256"
                            @value-changed="${(e: CustomEvent)=>{
                                let b = embedBinder.for(embedBinder.model.author.name);
                                b.value = e.detail.value;
                                b.validate();
                            }}"
                            ${field(embedBinder.model.author.name)}
                        ></vaadin-text-field>
                        <vaadin-text-field
                            label="Author URL"
                            @value-changed="${(e: CustomEvent)=>{
                                let b = embedBinder.for(embedBinder.model.author.url);
                                b.value = e.detail.value;
                                b.validate();
                            }}"
                            ${field(embedBinder.model.author.url)}
                        ></vaadin-text-field>
                        <vaadin-text-field
                            label="Author Icon URL"
                            @value-changed="${(e: CustomEvent)=>{
                                let b = embedBinder.for(embedBinder.model.author.icon_url);
                                b.value = e.detail.value;
                                b.validate();
                            }}"
                            ${field(embedBinder.model.author.icon_url)}
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
                            ${field(embedBinder.model.title)}
                        ></vaadin-text-field>
                        <vaadin-text-area
                            label="Description ${embedBinder.for(embedBinder.model.description).value?.length??0}/4096"
                            minlength="0"
                            maxlength="4096"
                            ${field(embedBinder.model.description)}
                        ></vaadin-text-area>
                        <vaadin-text-field
                            label="URL"
                            ${field(embedBinder.model.url)}
                        ></vaadin-text-field>
                        <vaadin-horizontal-layout style="align-items: baseline" >
                            <vaadin-text-field
                                label="Color"
                                minlength="0"
                                maxlength="7"
                                placeholder="#rrggbb"
                                value = "${ifDefined(eUtils.numberToHexColor(embedBinder.for(embedBinder.model.color).value))}"
                                pattern = "^#(?:[0-9a-fA-F]{3}){1,2}$"
                                @value-changed="${(e: CustomEvent) => {
                                    if(validators.isHexColor(e.detail.value)){
                                        embedBinder.for(embedBinder.model.color).value = eUtils.hexToNumberColor(e.detail.value);
                                    }else{
                                        embedBinder.for(embedBinder.model.color).value = undefined;
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
                                        embedBinder.for(embedBinder.model.color).value = eUtils.hexToNumberColor(e.detail.value);
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
                <vaadin-details opened>
                    <div slot="summary">Images</div>
                    <vaadin-text-field
                        label="Image URL"
                        @value-changed="${(e: CustomEvent)=>{
                            let b = embedBinder.for(embedBinder.model.image.url);
                            b.value = e.detail.value;
                            b.validate();
                        }}"
                        ${field(embedBinder.model.image.url)}
                    ></vaadin-text-field>
                    <vaadin-text-field
                        label="Thumbnail URL"
                        @value-changed="${(e: CustomEvent)=>{
                            let b = embedBinder.for(embedBinder.model.thumbnail.url);
                            b.value = e.detail.value;
                            b.validate();
                        }}"
                        ${field(embedBinder.model.thumbnail.url)}
                    ></vaadin-text-field>
                </vaadin-details>
                <vaadin-details opened>
                    <div slot="summary">Footer</div>
                    <vaadin-vertical-layout>
                        <vaadin-text-area
                            label="Footer ${embedBinder.for(embedBinder.model.footer.text).value?.length??0}/2048"
                            minlength="0"
                            maxlength="2048"
                            @change="${()=>{
                                embedBinder.for(embedBinder.model.footer.text).validate();
                            }}"
                            ${field(embedBinder.model.footer.text)}
                        ></vaadin-text-area>
                        <vaadin-date-time-picker
                            label="Timestamp"
                            date-placeholder="DD.MM.YYYY"
                            time-placeholder="hh:mm"
                            step="${60*15}"
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
                                embedBinder.for(embedBinder.model.timestamp).value = d.toISOString();
                            }}"
                        ></vaadin-date-time-picker>
                        
                        <vaadin-text-field
                            label="Footer Icon URL"
                            @value-changed="${(e: CustomEvent)=>{
                                let b = embedBinder.for(embedBinder.model.footer.icon_url);
                                b.value = e.detail.value;
                                b.validate();
                            }}"
                            ${field(embedBinder.model.footer.icon_url)}
                        ></vaadin-text-field>
                    </vaadin-vertical-layout>
                </vaadin-details>
            </vaadin-details>
            
        </vaadin-horizontal-layout>
        `;
    }
    buildField(embedBinder: BinderNode<Embed, EmbedModel<Embed>>, fieldBinder: BinderNode<Field, FieldModel<Field>>) {
        let fields = embedBinder.for(embedBinder.model.fields).value;
        let f = fieldBinder.value;
        let j = fields && f ? fields.indexOf(f) : -1;
        if(j<0) throw new Error('Field not found');

        let name = fieldBinder.value?.name??'';
        let value = fieldBinder.value?.value??'';
        //fieldBinder.validate();

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
