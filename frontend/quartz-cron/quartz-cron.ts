import { css, CSSResultGroup, html, LitElement } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import '@vaadin/tabs';
import '@vaadin/vertical-layout';
import cronstrue from 'cronstrue';

interface units {
    every_unit:boolean;

    every_x_unit:boolean;
    every_x:string;
    every_x_start:string;

    selected_unit:boolean;
    selected: string[];

    range_unit:boolean;
    range_a:string;
    range_b:string;
};

function allowEveryHour(minutes:units){
    if(minutes.selected.length<2) return true;
    return Math.abs(Number(minutes.selected[0]) - Number(minutes.selected[minutes.selected.length-1])) == 30;
}

function areHoursNextToEachOther(hours:units){
    if(hours.every_unit||hours.range_unit) return true;
    if(hours.every_x_unit&&hours.every_x=='1') return true;
    if(hours.selected_unit){
        if(hours.selected.length<2) return false;
        var near = false;
        for(var i = 0; i< hours.selected.length; i++){
            var a,b;
            a = hours.selected[i];
            if(i==hours.selected.length-1){
                b = hours.selected[0];
                if(b=='0'&&a=='23'||b=='23'&&a=='0'){
                    near = true;
                }
            }else{
                b = hours.selected[i+1];
                if(Number(b)-Number(a)==1){
                    near = true;
                }
            }
        }
        return near;
    }
    return false;
}

@customElement('quartz-cron')
export class QuartzCron extends LitElement {

    @state()
    expression:string='';

    selectedTab:number=0;

    private minutes:units ={
        selected: [],
        every_unit: false,
        every_x: '',
        every_x_start: '',
        range_a: '',
        range_b: '',
        every_x_unit: false,
        selected_unit: false,
        range_unit: false
    }

    private hours:units = {
        selected: [],
        every_unit: false,
        every_x: '1',
        every_x_start: '0',
        range_a: '0',
        range_b: '0',
        every_x_unit: false,
        selected_unit: true,
        range_unit: false
    }

    //private selectedMinutes: string[]=[];
    //private hoursAllow:boolean = true;
    //private minutesAllow:boolean = true;
    private selectedHourOption:number = 2;



    static styles = css`
        :host{
            width:100%;
            max-width:40em;
        }
        vaadin-checkbox > label {
            width:fit-content;
        }
        vaadin-checkbox > vaadin-checkbox-container{
            width:fit-content;
        }
        .cbox{
            max-width:7%;
            min-width:7%;
            padding-right:15px;
        }
        .choice-text{
            padding: var(--lumo-space-xs) var(--lumo-space-s) var(--lumo-space-xs) var(--lumo-space-xs);
        }
        .hour-select{
            width: 4.45em;
        }
    `;

    render() {
        return html`
            <vaadin-tabs 
                style = "width:100%;"
                theme="centered" 
                @selected-changed="${(e: CustomEvent) =>{
                    this.selectedTab = e.detail.value;
                    this.requestUpdate();
                }}"
            >
                <vaadin-tab>Seconds</vaadin-tab>
                <vaadin-tab>Minutes</vaadin-tab>
                <vaadin-tab>Hours</vaadin-tab>
                <vaadin-tab>Day</vaadin-tab>
                <vaadin-tab>Month</vaadin-tab>
                <vaadin-tab>Year</vaadin-tab>
            </vaadin-tabs>
            ${this.buildContent()}
        `;
    }

    buildContent(){
        switch (this.selectedTab) {
            case 0: //seconds
                return html`
                <vaadin-form-item>
                    <label slot="label">Specific second:</label>
                    <vaadin-integer-field
                        value="0" 
                        has-controls 
                        min="0" 
                        max="59"
                    ></vaadin-integer-field>
                </vaadin-form-item>
                `;
            case 1: //minutes
                return html`
                    <vaadin-checkbox-group 
                        style="flex-wrap:wrap;" 
                        label="Specific minute (choose one or many)"
                        .value="${this.minutes.selected}"
                        @value-changed="${(e: CustomEvent) => {
                                this.minutes.selected = e.detail.value;
                                this.requestUpdate();
                        }}"
                    >
                        ${this.buildCheckboxes('minutes',this.range(0,60))}
                    </vaadin-checkbox-group>
                `;
            case 2: //hours
                var getHours = ()=>{
                    return this.range(1,25).map(i=>{
                        return {
                            label: i.toString(),
                            value: i.toString(),
                            disabled: i==1 && !allowEveryHour(this.minutes),
                        }
                    })
                };

                var handleChoice = (i:number)=>{
                    this.selectedHourOption = i;
                    this.hours.every_unit = i==0;
                    this.hours.every_x_unit = i==1;
                    this.hours.selected_unit = i==2;
                    this.hours.range_unit = i==3;
                    this.requestUpdate();
                };
                var getHour = ()=>{
                    if(this.hours.every_x=='1' && !allowEveryHour(this.minutes)){
                        this.hours.every_x = '2';
                    }
                    return this.hours.every_x;
                }

                return html`
                    <vaadin-vertical-layout>
                        <vaadin-horizontal-layout style="align-items: baseline">
                            <vaadin-radio-button 
                                value="*" 
                                .disabled="${!allowEveryHour(this.minutes)}"
                                .checked="${this.hours.every_unit}"
                                @input="${(e:any)=>{
                                    handleChoice(0);
                                }}"
                            ></vaadin-radio-button>
                            <span class="choice-text" @click="${(e:any)=>(handleChoice(0))}">
                                Every hour
                            </span>
                        </vaadin-horizontal-layout>
                        <vaadin-horizontal-layout style="align-items: baseline">
                            <vaadin-radio-button 
                                value="/" 
                                .checked="${this.hours.every_x_unit}"
                                @input="${(e:any)=>{
                                    handleChoice(1);
                                }}"
                            ></vaadin-radio-button>
                            
                            <span class="choice-text" @click="${(e:any)=>(handleChoice(1))}">
                                Every
                            </span>
                            <vaadin-select
                                class="hour-select"
                                .items = "${getHours()}"
                                .value = "${getHour()}"
                                .disabled = "${!this.hours.every_x_unit}"
                                @value-changed="${(e: CustomEvent) => {
                                    this.hours.every_x = e.detail.value;
                                }}"
                            ></vaadin-select>
                            <span class="choice-text" @click="${(e:any)=>(handleChoice(1))}">
                                hour(s) starting at hour
                            </span>
                            <vaadin-select
                                class="hour-select"
                                .items = "${this.range(0,24).map(i=>{
                                    return {
                                        label: i.toString(),
                                        value: i.toString()
                                    }
                                })}"
                                .value = "${this.hours.every_x_start}"
                                .disabled = "${!this.hours.every_x_unit}"
                                @value-changed="${(e: CustomEvent) => {
                                    this.hours.every_x_start = e.detail.value;
                                }}"
                            ></vaadin-select>
                        </vaadin-horizontal-layout>

                        <vaadin-horizontal-layout style="align-items: baseline">
                            <vaadin-radio-button 
                                value=","
                                .checked="${this.hours.selected_unit}"
                                @input="${(e:any)=>{
                                    handleChoice(2);
                                }}"
                            ></vaadin-radio-button>
                            <span class="choice-text" @click="${(e:any)=>(handleChoice(2))}">
                                Specific hour (choose one or many)
                            </span>
                        </vaadin-horizontal-layout>
                        <!-- we want it outside -->
                            <vaadin-checkbox-group 
                                style="flex-wrap:wrap;"
                                .value="${this.hours.selected}"
                                .disabled="${!this.hours.selected_unit}"
                                @value-changed="${(e: CustomEvent) => {
                                    this.hours.selected = e.detail.value;
                                    this.requestUpdate();
                                }}"
                            >
                                ${this.buildCheckboxes('hours',this.range(0,24))}
                            </vaadin-checkbox-group>
                        <!-- -->
                        <vaadin-horizontal-layout style="align-items: baseline">
                            <vaadin-radio-button 
                                value="-" 
                                .disabled="${!allowEveryHour(this.minutes)}" 
                                .checked="${this.hours.range_unit}"
                                @input="${(e:any)=>{
                                    handleChoice(3);
                                }}"
                            ></vaadin-radio-button>
                            <span class="choice-text" @click="${(e:any)=>(handleChoice(3))}" >
                                Every hour between hour
                            </span>
                            <vaadin-select
                                class="hour-select"
                                .items = "${this.range(0,24).map(i=>{
                                    return {
                                        label: i.toString(),
                                        value: i.toString()
                                    }
                                })}"
                                .value = "${this.hours.range_a}"
                                .disabled = "${!this.hours.range_unit}"
                                @value-changed="${(e: CustomEvent) => {
                                    this.hours.range_a = e.detail.value;
                                }}"
                            ></vaadin-select>
                            <span class="choice-text" @click="${(e:any)=>(handleChoice(3))}">
                                and hour
                            </span>
                            <vaadin-select
                                class="hour-select"
                                .items = "${this.range(0,24).map(i=>{
                                    return {
                                        label: i.toString(),
                                        value: i.toString()
                                    }
                                })}"
                                .value = "${this.hours.range_b}"
                                .disabled = "${!this.hours.range_unit}"
                                @value-changed="${(e: CustomEvent) => {
                                    this.hours.range_b = e.detail.value;
                                }}"
                            ></vaadin-select>
                            
                        </vaadin-horizontal-layout>
                    </vaadin-vertical-layout>
                `;
            case 3: //day
            case 4: //month
            case 5: //year
            default:
                return html`Which tab did you pick? we dont have that one!`;
        }
    }

    buildCheckboxes(type:string,list:number[]){
        var isEnabled;
        var isChecked;
        switch (type) {
            case 'minutes':
                isEnabled = (i:number)=>{
                    var first = Number(this.minutes.selected[0]);
                    var diff = Math.abs(i-first);
                    if(this.minutes.selected.length>=2){
                        return this.minutes.selected.includes(i.toString());
                    }
                    return (diff==0||diff==30||(!areHoursNextToEachOther(this.hours) && diff>30)||this.minutes.selected.length==0);
                }
                isChecked = (i:number)=>{
                    return this.minutes.selected.includes(i.toString());
                }
                break;
            case 'hours':
                isEnabled = (i:number)=>{
                    if(this.hours.selected.includes(i.toString())) return true;
                    if(allowEveryHour(this.minutes)) return true;
                    var isNear = false;
                    for(var j in this.hours.selected){
                        if(Math.abs(Number(j)-i)<2){
                            isNear = true;
                        }
                    }
                    return !isNear;
                }
                isChecked = (i:number)=>{
                    return this.hours.selected.includes(i.toString());
                }
                break;
            case 'days':
                isEnabled = (i:number)=>{
                    return true;
                }
                break;
            default:
                isEnabled = (i:number)=>{
                    console.log('unexpected behaivor reached');
                    return true;
                }
                break;
        }

        return html`
            ${list.map((i => {
                return html`
                    <vaadin-checkbox 
                        class="cbox" 
                        value="${i}" 
                        label="${i}" 
                        .disabled="${!isEnabled(i)}" 
                        .checked="${isChecked(i)}"></vaadin-checkbox>
                `;
            }))}
        `;
    }

    range(from:number, to:number){
        var list = [];
        for (var i = from; i < to; i++) {
            list.push(i);
        }
        return list;
    }
}
