import { css, html, LitElement } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import '@vaadin/tabs';
import '@vaadin/form-layout';
import '@vaadin/integer-field';
import '@vaadin/vertical-layout';
import '@vaadin/select';
import '@vaadin/checkbox';
import '@vaadin/checkbox-group';
import '@vaadin/radio-group';

import '@vaadin/text-field';

import cronstrue from 'cronstrue';

interface units {
    is_every_unit:boolean;

    is_every_x_unit:boolean;
    every_x:string;
    every_x_start:string;

    is_selected_unit:boolean;
    selected: string[];

    is_range_unit:boolean;
    range_a:string;
    range_b:string;
};

interface days extends units{
    is_every_x_week:boolean;
    every_x_week:string;
    every_x_start_week:string;

    is_selected_week:boolean;
    selected_week: string[];

    is_range_week:boolean;
    range_week_a:string;
    range_week_b:string;

    is_last_day:boolean;
    is_last_mon_fri:boolean;

    is_last_weekday:boolean;
    last_weekday:string;

    is_x_days_before_end:boolean;
    x_day_before_end:string;

    is_nearest_weekday:boolean;
    nearest_weekday_to:string;

    is_x_th_weekday:boolean;
    x_th_day:string;
    x_th_weekday:string;
}


function allowEveryHour(minutes:units){
    if(minutes.selected.length<2) return true;
    return Math.abs(Number(minutes.selected[0]) - Number(minutes.selected[minutes.selected.length-1])) == 30;
}

function areHoursNextToEachOther(hours:units){
    if(hours.is_every_unit||hours.is_range_unit) return true;
    if(hours.is_every_x_unit&&hours.every_x=='1') return true;
    if(hours.is_selected_unit){
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

    expression:string='0 0 0 ? * * *';

    selectedTab:number=0;

    private seconds:number=0;

    private minutes:units ={
        selected: [],
        is_every_unit: false,
        every_x: '',
        every_x_start: '',
        range_a: '',
        range_b: '',
        is_every_x_unit: false,
        is_selected_unit: false,
        is_range_unit: false
    };

    private hours:units = {
        selected: [],
        is_every_unit: false,
        every_x: '1',
        every_x_start: '0',
        range_a: '0',
        range_b: '0',
        is_every_x_unit: false,
        is_selected_unit: true,
        is_range_unit: false
    };

    private days:days = {
        is_every_unit: true,

        is_every_x_week: false,
        every_x_week: '1',
        every_x_start_week: 'MON',
        is_every_x_unit: false,
        every_x: '1',
        every_x_start: '1',

        is_selected_week: false,
        selected_week: [],
        is_selected_unit: false,
        selected: [],

        is_range_week: false,
        range_week_a: 'MON',
        range_week_b: 'FRI',
        is_range_unit: false,
        range_a: '1',
        range_b: '1',

        is_last_day: false,
        is_last_mon_fri: false,

        is_last_weekday: false, //weekday
        last_weekday: 'MON',

        is_x_days_before_end: false,
        x_day_before_end: '1',

        is_nearest_weekday: false,
        nearest_weekday_to: '1',

        is_x_th_weekday: false,
        x_th_day: '1',
        x_th_weekday: 'MON'
    };

    private months = {
        is_every_month: true,
        is_selected: false,
        selected: Array<string>()
    }
    private years = {
        is_every_year: true,
        is_selected: false,
        selected:Array<string>()
    }
    
    static styles = css`
        :host{
            width:100%;
            max-width:40em;
            display:flex;
            flex-direction:column;
            align-items:flex-start;
        }
        vaadin-checkbox > label {
            width:fit-content;
            padding-left:0;
        }
        vaadin-checkbox > vaadin-checkbox-container{
            width:fit-content;
        }
        vaadin-tabs {
            margin-bottom:0.5em;
        }
        .cbox{
            max-width:5%;
            min-width:5%;
            padding-right:15px;
        }
        .dbox{
            padding-right:15px;
            width: 7em;
        }
        .choice-text{
            padding: var(--lumo-space-xs) var(--lumo-space-s) var(--lumo-space-xs) var(--lumo-space-xs);
        }
        .hour-select{
            width: 4.45em;
        }
        .day-select-small{
            width: 5.8em;
        }
        .day-select{
            width: 8.6em;
        }

        .hour-field{
            width: 3em;
        }
        .baseline{
            align-items:baseline;
        }
        
        vaadin-text-field::part(label) {
            white-space: normal;
        }
    `;

    render() {
        return html`
            <vaadin-text-field
                .label="${cronstrue.toString(this.expression, { use24HourTimeFormat: true, verbose:true, throwExceptionOnParseError:false }) }"
                .value="${this.expression}"
                @value-changed="${(e: CustomEvent) =>{
                    this.validateInput(e.detail.value);
                }}"
            >
                <div slot="helper">
                    <a href="https://www.freeformatter.com/cron-expression-generator-quartz.html#cronexpressionexamples">Quartz cron expression</a>
                </div>
            </vaadin-text-field>
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
                <vaadin-tab>Day of week</vaadin-tab>
                <vaadin-tab>Day of month</vaadin-tab>
                <vaadin-tab>Month</vaadin-tab>
                <vaadin-tab>Year</vaadin-tab>
            </vaadin-tabs>
            ${this.buildContent()}
        `;
    }

    validateInput(input:string){
        //TODO
        this.expression = input;
    }

    buildContent(){
        var daysInterval = this.range(1,32).map(i=>{ //every X days
            return {
                label: i.toString(),
                value: i.toString(),
            }
        });

        var daysIndex = this.range(1,32).map(i=>{ 
            var label = i.toString();
            if(i==1||i==21||i==31){
                label += 'st';
            }else if(i==2||i==22){
                label += 'nd';
            }else if(i==3||i==23){
                label += 'rd';
            }else{
                label += 'th';
            }
            return {
                label: label,
                value: i.toString(),
            }
        });

        var weekdaysInterval = this.range(1,8).map(i=>{
            return {
                label: i.toString(),
                value: i.toString(),
            }
        });

        var weekdaysIndex = [
            {
                label: 'Sunday',
                value: 'SUN',
            },
            {
                label: 'Monday',
                value: 'MON',
            },
            {
                label: 'Tuesday',
                value: 'TUE',
            },
            {
                label: 'Wednesday',
                value: 'WED',
            },
            {
                label: 'Thursday',
                value: 'THU',
            },
            {
                label: 'Friday',
                value: 'FRI',
            },
            {
                label: 'Saturday',
                value: 'SAT',
            },
        ]

        var handleChoiceWeekday = (i:number)=>{    //[0-12]
            this.days.is_every_unit = i==0; //every day //both
            this.days.is_every_x_week = i==1; //every x days starting on sunday
            this.days.is_selected_week = i==2; //specific day of the week
            this.days.is_range_week = i==3; //every day between days of the week
            this.days.is_last_mon_fri = i==4; // last weekday of the month
            this.days.is_last_weekday = i==5; //on the last [week day] of the month
            this.days.is_x_th_weekday = i==6; //on the Xth [weekday] of the month //both
        };

        var handleChoiceDay = (i:number)=>{    //[0-12]
            this.days.is_every_unit = i==0; //every day //both
            this.days.is_every_x_unit = i==1; //every x days starting on 1st of the month
            this.days.is_selected_unit = i==2; //specific day of the month
            this.days.is_range_unit = i==3;   //every day between the A and B of the month
            this.days.is_last_day = i==4;       //last day of the month
            this.days.is_x_days_before_end = i==5;  //x days before the end of the month
            this.days.is_nearest_weekday = i==6; //on the nearest weekday(monday to friday) to the xth of the month
            this.days.is_x_th_weekday = i==7; //on the Xth [weekday] of the month //both
        };

        switch (this.selectedTab) {
            case 0: //seconds
                return html`
                <vaadin-form-item>
                    <label slot="label">Specific second:</label>
                    <vaadin-integer-field
                        value="${this.seconds}" 
                        has-controls 
                        min="0" 
                        max="59"
                        error-message="[0-59]"
                        @value-changed="${(e: CustomEvent) => {
                            this.seconds = e.detail.value;
                        }}"
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
                var allowEveryHourRes = allowEveryHour(this.minutes);

                var hoursInterval = this.range(1,25).map(i=>{ //every X hours, cant do every 0 hours so offset by one
                    return {
                        label: i.toString(),
                        value: i.toString(),
                        disabled: i==1 && !allowEveryHourRes, //cant do every hour to abide the limits
                    }
                });

                var hoursIndex = this.range(0,24).map(i=>{ 
                    return {
                        label: i.toString(),
                        value: i.toString(),
                    }
                });
        
                var handleChoiceHour = (i:number)=>{
                    if(!allowEveryHourRes){
                        if(i==0||i==3) return;
                    }
                    this.hours.is_every_unit = i==0;
                    this.hours.is_every_x_unit = i==1;
                    this.hours.is_selected_unit = i==2;
                    this.hours.is_range_unit = i==3;
                    this.requestUpdate();
                };

                if(this.hours.every_x=='1' && !allowEveryHourRes){
                    this.hours.every_x = '2';
                }
                var currentHourInterval = this.hours.every_x;

                return html`
                    <!-- every hour -->
                    <div class="baseline">
                        <vaadin-radio-button 
                            .disabled="${!allowEveryHourRes}"
                            .checked="${this.hours.is_every_unit}"
                            @input="${(e:any)=>(handleChoiceHour(0))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoiceHour(0))}">
                            Every hour
                        </span>
                    </div>

                    <!-- every x hours starting at -->
                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.hours.is_every_x_unit}"
                            @input="${(e:any)=>(handleChoiceHour(1))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoiceHour(1))}">
                            Every
                        </span>
                        <!--  i'll leave it in for now
                        <vaadin-integer-field
                            .value="${currentHourInterval}" 
                            .disabled = "${!this.hours.is_every_x_unit}"
                            class="hour-field"
                            min="${allowEveryHourRes?'1':'2'}" 
                            max="24"
                            error-message="${allowEveryHourRes?'[1-24]':'[2-24]'}"
                            @value-changed="${(e: CustomEvent) => {
                                this.hours.every_x = e.detail.value;
                            }}"
                        ></vaadin-integer-field>
                        -->
                        <vaadin-select
                            class="hour-select"
                            .items = "${this.hours.is_every_x_unit ? hoursInterval : [{label:currentHourInterval, value:currentHourInterval}]}"
                            .value = "${currentHourInterval}"
                            .disabled = "${!this.hours.is_every_x_unit}"
                            @value-changed="${(e: CustomEvent) => {
                                this.hours.every_x = e.detail.value;
                            }}"
                        ></vaadin-select>
                        <span class="choice-text" @click="${(e:any)=>(handleChoiceHour(1))}">
                            hour(s) starting at hour
                        </span>
                        <!--
                        <vaadin-integer-field
                            .value="${this.hours.every_x_start}" 
                            .disabled = "${!this.hours.is_every_x_unit}"
                            class="hour-field"
                            min="0" 
                            max="23"
                            error-message="[0-23]"
                            @value-changed="${(e: CustomEvent) => {
                                this.hours.every_x_start = e.detail.value;
                            }}"
                        ></vaadin-integer-field>
                        -->
                        <vaadin-select
                            class="hour-select"
                            .items = "${this.hours.is_every_x_unit ? hoursIndex : [{label:this.hours.every_x_start, value:this.hours.every_x_start}]}"
                            .value = "${this.hours.every_x_start}"
                            .disabled = "${!this.hours.is_every_x_unit}"
                            @value-changed="${(e: CustomEvent) => {
                                this.hours.every_x_start = e.detail.value;
                            }}"
                        ></vaadin-select> 
                    </div>

                    <!-- specific hour -->
                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.hours.is_selected_unit}"
                            @input="${(e:any)=>(handleChoiceHour(2))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoiceHour(2))}">
                            Specific hour (choose one or many)
                        </span>
                    </div>
                    <vaadin-checkbox-group 
                        style="flex-wrap:wrap;"
                        .value="${this.hours.selected}"
                        .disabled="${!this.hours.is_selected_unit}"
                        @value-changed="${(e: CustomEvent) => {
                            this.hours.selected = e.detail.value;
                            this.requestUpdate();
                        }}"
                    >
                        ${this.buildCheckboxes('hours',this.range(0,24))}
                    </vaadin-checkbox-group>

                    <!-- every hour between A and B -->
                    <div class="baseline">
                        <vaadin-radio-button 
                            .disabled="${!allowEveryHourRes}" 
                            .checked="${this.hours.is_range_unit}"
                            @input="${(e:any)=>(handleChoiceHour(3))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoiceHour(3))}" >
                            Every hour between hour
                        </span>
                        <!--
                        <vaadin-integer-field
                            .value="${this.hours.range_a}" 
                            .disabled = "${!this.hours.is_range_unit}"
                            class="hour-field"
                            min="0" 
                            max="23"
                            error-message="[0-23]"
                            @value-changed="${(e: CustomEvent) => {
                                this.hours.range_a = e.detail.value;
                            }}"
                        ></vaadin-integer-field>
                        -->
                        <vaadin-select
                            class="hour-select"
                            .items = "${this.hours.is_range_unit ? hoursIndex : [{label:this.hours.range_a, value:this.hours.range_a}]}"
                            .value = "${this.hours.range_a}"
                            .disabled = "${!this.hours.is_range_unit}"
                            @value-changed="${(e: CustomEvent) => {
                                this.hours.range_a = e.detail.value;
                            }}"
                        ></vaadin-select> 
                        <span class="choice-text" @click="${(e:any)=>(handleChoiceHour(3))}">
                            and hour
                        </span>
                        <!-- 
                        <vaadin-integer-field
                            .value="${this.hours.range_b}" 
                            .disabled = "${!this.hours.is_range_unit}"
                            class="hour-field"
                            min="0" 
                            max="23"
                            error-message="[0-23]"
                            @value-changed="${(e: CustomEvent) => {
                                this.hours.range_b = e.detail.value;
                            }}"
                        ></vaadin-integer-field>
                        -->
                        <vaadin-select
                            class="hour-select"
                            .items = "${this.hours.is_range_unit ? hoursIndex : [{label:this.hours.range_b, value:this.hours.range_b}]}"
                            .value = "${this.hours.range_b}"
                            .disabled = "${!this.hours.is_range_unit}"
                            @value-changed="${(e: CustomEvent) => {
                                this.hours.range_b = e.detail.value;
                            }}"
                        ></vaadin-select>
                    </div>
                `;
            case 3: //day of week
                var handleChoice = (i:number)=>{
                    handleChoiceDay(-1);
                    handleChoiceWeekday(i);
                    this.requestUpdate();
                }

                return html`
                    <!-- every day -->
                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.days.is_every_unit}"
                            @input="${(e:any)=>(handleChoice(0))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(0))}">
                            Every day
                        </span>
                    </div>

                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.days.is_every_x_week}"
                            @input="${(e:any)=>(handleChoice(1))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(1))}">
                            Every
                        </span>
                        <vaadin-select
                            class="hour-select"
                            .items = "${this.days.is_every_x_week ? weekdaysInterval : [{label:this.days.every_x_week, value:this.days.every_x_week}]}"
                            .value = "${this.days.every_x_week}"
                            .disabled = "${!this.days.is_every_x_week}"
                            @value-changed="${(e: CustomEvent) => {
                                this.days.every_x_week = e.detail.value;
                            }}"
                        ></vaadin-select>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(1))}">
                            day(s) starting on
                        </span>
                        <vaadin-select
                            class="day-select"
                            .items = "${this.days.is_every_x_week ? weekdaysIndex : [{label:this.getFullName(this.days.every_x_start_week), value:this.days.every_x_start_week}]}"
                            .value = "${this.days.every_x_start_week}"
                            .disabled = "${!this.days.is_every_x_week}"
                            @value-changed="${(e: CustomEvent) => {
                                this.days.every_x_start_week = e.detail.value;
                            }}"
                        ></vaadin-select> 
                    </div>

                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.days.is_selected_week}"
                            @input="${(e:any)=>(handleChoice(2))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(2))}">
                            Specific day of week (choose one or many)
                        </span>
                    </div>
                    <vaadin-checkbox-group 
                        style="flex-wrap:wrap;"
                        .value="${this.days.selected_week}"
                        .disabled="${!this.days.is_selected_week}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.selected_week = e.detail.value;
                        }}"
                    >
                        ${this.buildDaysCheckboxes(weekdaysIndex)}
                    </vaadin-checkbox-group>

                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.days.is_range_week}"
                            @input="${(e:any)=>(handleChoice(3))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(3))}">
                            Every day between
                        </span>
                        <vaadin-select
                            class="day-select"
                            .items = "${this.days.is_range_week ? weekdaysIndex : [{label:this.getFullName(this.days.range_week_a), value:this.days.range_week_a}]}"
                            .value = "${this.days.range_week_a}"
                            .disabled = "${!this.days.is_range_week}"
                            @value-changed="${(e: CustomEvent) => {
                                this.days.range_week_a = e.detail.value;
                            }}"
                        ></vaadin-select>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(3))}">
                            and
                        </span>
                        <vaadin-select
                            class="day-select"
                            .items = "${this.days.is_range_week ? weekdaysIndex : [{label:this.getFullName(this.days.range_week_b), value:this.days.range_week_b}]}"
                            .value = "${this.days.range_week_b}"
                            .disabled = "${!this.days.is_range_week}"
                            @value-changed="${(e: CustomEvent) => {
                                this.days.range_week_b = e.detail.value;
                            }}"
                        ></vaadin-select> 
                    </div>

                    
                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.days.is_last_mon_fri}"
                            @input="${(e:any)=>(handleChoice(4))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(4))}">
                            On the last weekday (Monday-Friday) of the month
                        </span>
                    </div>

                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.days.is_last_weekday}"
                            @input="${(e:any)=>(handleChoice(5))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(5))}">
                            On the last
                        </span>
                        <vaadin-select
                            class="day-select"
                            .items = "${this.days.is_last_weekday ? weekdaysIndex : [{label:this.getFullName(this.days.last_weekday), value:this.days.last_weekday}]}"
                            .value = "${this.days.last_weekday}"
                            .disabled = "${!this.days.is_last_weekday}"
                            @value-changed="${(e: CustomEvent) => {
                                this.days.last_weekday = e.detail.value;
                            }}"
                        ></vaadin-select>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(5))}">
                            of the month
                        </span>
                    </div>

                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.days.is_x_th_weekday}"
                            @input="${(e:any)=>(handleChoice(6))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(6))}">
                            On the 
                        </span>
                        <vaadin-select
                            class="day-select-small"
                            .items = "${this.days.is_x_th_weekday ? daysIndex.slice(0,5) : [ daysIndex[Number(this.days.x_th_day)-1] ]}"
                            .value = "${this.days.x_th_day}"
                            .disabled = "${!this.days.is_x_th_weekday}"
                            @value-changed="${(e: CustomEvent) => {
                                this.days.x_th_day = e.detail.value;
                            }}"
                        ></vaadin-select> 
                        <vaadin-select
                            class="day-select"
                            .items = "${this.days.is_x_th_weekday ? weekdaysIndex : [{label:this.getFullName(this.days.x_th_weekday), value:this.days.x_th_weekday}]}"
                            .value = "${this.days.x_th_weekday}"
                            .disabled = "${!this.days.is_x_th_weekday}"
                            @value-changed="${(e: CustomEvent) => {
                                this.days.x_th_weekday = e.detail.value;
                            }}"
                        ></vaadin-select>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(6))}">
                            of the month
                        </span>
                    </div>
                `
            case 4: //day of month
                var handleChoice = (i:number)=>{
                    handleChoiceWeekday(-1);
                    handleChoiceDay(i);
                    this.requestUpdate();
                }

                return html`
                    <!-- every day -->
                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.days.is_every_unit}"
                            @input="${(e:any)=>(handleChoice(0))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(0))}">
                            Every day
                        </span>
                    </div>

                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.days.is_every_x_unit}"
                            @input="${(e:any)=>(handleChoice(1))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(1))}">
                            Every
                        </span>
                        <vaadin-select
                            class="hour-select"
                            .items = "${this.days.is_every_x_unit ? daysInterval : [{label:this.days.every_x, value:this.days.every_x}]}"
                            .value = "${this.days.every_x}"
                            .disabled = "${!this.days.is_every_x_unit}"
                            @value-changed="${(e: CustomEvent) => {
                                this.days.every_x = e.detail.value;
                            }}"
                        ></vaadin-select>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(1))}">
                            day(s) starting on the
                        </span>
                        <vaadin-select
                            class="day-select-small"
                            .items = "${this.days.is_every_x_unit ? daysIndex : [ daysIndex[Number(this.days.every_x_start)-1] ]}"
                            .value = "${this.days.every_x_start}"
                            .disabled = "${!this.days.is_every_x_unit}"
                            @value-changed="${(e: CustomEvent) => {
                                this.days.every_x_start = e.detail.value;
                            }}"
                        ></vaadin-select> 
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(1))}">
                            of the month
                        </span>
                    </div>

                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.days.is_selected_unit}"
                            @input="${(e:any)=>(handleChoice(2))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(2))}">
                            Specific day of month (choose one or many)
                        </span>
                    </div>
                    <vaadin-checkbox-group 
                        style="flex-wrap:wrap;"
                        .value="${this.days.selected}"
                        .disabled="${!this.days.is_selected_unit}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.selected = e.detail.value;
                        }}"
                    >
                        ${this.buildCheckboxes('days',this.range(1,32))}
                    </vaadin-checkbox-group>
                    
                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.days.is_range_unit}"
                            @input="${(e:any)=>(handleChoice(3))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(3))}">
                            Every day between the
                        </span>
                        <vaadin-select
                            class="day-select"
                            .items = "${this.days.is_range_unit ? daysIndex : [ daysIndex[Number(this.days.range_a)-1] ]}"
                            .value = "${this.days.range_a}"
                            .disabled = "${!this.days.is_range_unit}"
                            @value-changed="${(e: CustomEvent) => {
                                this.days.range_a = e.detail.value;
                                //TODO change to integer inputs with suffix?
                            }}"
                        ></vaadin-select>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(3))}">
                            and
                        </span>
                        <vaadin-select
                            class="day-select"
                            .items = "${this.days.is_range_unit ? daysIndex : [ daysIndex[Number(this.days.range_b)-1] ]}"
                            .value = "${this.days.range_b}"
                            .disabled = "${!this.days.is_range_unit}"
                            @value-changed="${(e: CustomEvent) => {
                                this.days.range_b = e.detail.value;
                            }}"
                        ></vaadin-select> 
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(3))}">
                            of the month
                        </span>
                    </div>

                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.days.is_last_day}"
                            @input="${(e:any)=>(handleChoice(4))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(4))}">
                            On the last day of the month
                        </span>
                    </div>
                    
                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.days.is_x_days_before_end}"
                            @input="${(e:any)=>(handleChoice(5))}"
                        ></vaadin-radio-button>
                        <vaadin-select
                            class="hour-select"
                            .items = "${this.days.is_x_days_before_end ? daysInterval : [{label:this.days.x_day_before_end, value:this.days.x_day_before_end}]}"
                            .value = "${this.days.x_day_before_end}"
                            .disabled = "${!this.days.is_x_days_before_end}"
                            @value-changed="${(e: CustomEvent) => {
                                this.days.x_day_before_end = e.detail.value;
                            }}"
                        ></vaadin-select>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(5))}">
                            day(s) before the end of the month
                        </span>
                    </div>

                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.days.is_nearest_weekday}"
                            @input="${(e:any)=>(handleChoice(6))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(6))}">
                            Nearest weekday (Monday to Friday) to the
                        </span>
                        <vaadin-select
                            class="day-select-small"
                            .items = "${this.days.is_nearest_weekday ? daysIndex : [ daysIndex[Number(this.days.nearest_weekday_to)-1] ]}"
                            .value = "${this.days.nearest_weekday_to}"
                            .disabled = "${!this.days.is_nearest_weekday}"
                            @value-changed="${(e: CustomEvent) => {
                                this.days.nearest_weekday_to = e.detail.value;
                            }}"
                        ></vaadin-select> 
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(6))}">
                            of the month
                        </span>
                    </div>

                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.days.is_x_th_weekday}"
                            @input="${(e:any)=>(handleChoice(7))}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(7))}">
                            On the 
                        </span>
                        <vaadin-select
                            class="day-select-small"
                            .items = "${this.days.is_x_th_weekday ? daysIndex.slice(0,5) : [ daysIndex[Number(this.days.x_th_day)-1] ]}"
                            .value = "${this.days.x_th_day}"
                            .disabled = "${!this.days.is_x_th_weekday}"
                            @value-changed="${(e: CustomEvent) => {
                                this.days.x_th_day = e.detail.value;
                            }}"
                        ></vaadin-select> 
                        <vaadin-select
                            class="day-select"
                            .items = "${this.days.is_x_th_weekday ? weekdaysIndex : [{label:this.getFullName(this.days.x_th_weekday), value:this.days.x_th_weekday}]}"
                            .value = "${this.days.x_th_weekday}"
                            .disabled = "${!this.days.is_x_th_weekday}"
                            @value-changed="${(e: CustomEvent) => {
                                this.days.x_th_weekday = e.detail.value;
                            }}"
                        ></vaadin-select>
                        <span class="choice-text" @click="${(e:any)=>(handleChoice(7))}">
                            of the month
                        </span>
                    </div>
                `;
            case 5: //month
                return html`
                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.months.is_every_month}"
                            @input="${(e:any)=>{
                                this.months.is_every_month = true;
                                this.months.is_selected = false;
                                this.requestUpdate();
                            }}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>{
                                this.months.is_every_month = true;
                                this.months.is_selected = false;
                                this.requestUpdate();
                        }}">
                            Every month
                        </span>
                    </div>
                    
                    <div class="baseline">
                        <vaadin-radio-button 
                            .checked="${this.months.is_selected}"
                            @input="${(e:any)=>{
                                this.months.is_every_month = false;
                                this.months.is_selected = true;
                                this.requestUpdate();
                            }}"
                        ></vaadin-radio-button>
                        <span class="choice-text" @click="${(e:any)=>{
                                this.months.is_every_month = false;
                                this.months.is_selected = true;
                                this.requestUpdate();
                        }}">
                            Specific month (choose one or many)
                        </span>
                    </div>
                    <vaadin-checkbox-group 
                        style="flex-wrap:wrap;"
                        .value="${this.months.selected}"
                        .disabled="${!this.months.is_selected}"
                        @value-changed="${(e: CustomEvent) => {
                            this.months.selected = e.detail.value;
                        }}"
                    >
                        ${this.buildCheckboxes('months',this.range(1,13))}
                    </vaadin-checkbox-group>
                `
            case 6: //year
            return html`
                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.years.is_every_year}"
                        @input="${(e:any)=>{
                            this.years.is_every_year = true;
                            this.years.is_selected = false;
                            this.requestUpdate();
                        }}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>{
                            this.years.is_every_year = true;
                            this.years.is_selected = false;
                            this.requestUpdate();
                    }}">
                        Every year
                    </span>
                </div>
                
                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.years.is_selected}"
                        @input="${(e:any)=>{
                            this.years.is_every_year = false;
                            this.years.is_selected = true;
                            this.requestUpdate();
                        }}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>{
                            this.years.is_every_year = false;
                            this.years.is_selected = true;
                            this.requestUpdate();
                    }}">
                        Specific year (choose one or many)
                    </span>
                </div>
                <vaadin-checkbox-group 
                    style="flex-wrap:wrap;"
                    .value="${this.years.selected}"
                    .disabled="${!this.years.is_selected}"
                    @value-changed="${(e: CustomEvent) => {
                        this.years.selected = e.detail.value;
                    }}"
                >
                    ${this.buildCheckboxes('years',this.range(2022,2046))}
                </vaadin-checkbox-group>
            `
            default:
                return html`Which tab did you pick? we dont have that one!`;
        }
    }

    getFullName(weekday:string|number){
        switch (weekday) {
            case 1:
            case 'SUN':
                return 'Sunday';
            case 2:
            case 'MON':
                return 'Monday';
            case 3:
            case 'TUE':
                return 'Tuesday';
            case 4:
            case 'WED':
                return 'Wednesday';
            case 5:
            case 'THU':
                return 'Thursday';
            case 6:
            case 'FRI':
                return 'Friday';
            case 7:
            case 'SAT':
                return 'Saturday';
            default:
                return '';
        }
    }
    getShortName(weekday:number){
        switch (weekday) {
            case 1:
                return 'SUN';
            case 2:
                return 'MON';
            case 3:
                return 'TUE';
            case 4:
                return 'WED';
            case 5:
                return 'THU';
            case 6:
                return 'FRI';
            case 7:
                return 'SAT';
            default:
                return '';
        }
    }

    buildDaysCheckboxes(values: {label:string; value:string;}[]){
        var isChecked = (val:string)=>{
            return this.days.selected_week.includes(val);
        }
        return html`
            ${values.map(i => {
                return html`
                    <vaadin-checkbox 
                        class="dbox" 
                        value="${i.value}" 
                        label="${i.label}" 
                        .checked="${isChecked(i.value)}"></vaadin-checkbox>
                `;
            })}
        `;
    }

    buildCheckboxes(type:string,list:number[]){
        var isEnabled: (i: number) => boolean;
        var isChecked: (i: number) => boolean;
        var cssclass = 'cbox';
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
                    for(var j = 0; j< this.hours.selected.length; j++){
                        if(Math.abs(Number(this.hours.selected[j])-i)<2){
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
                    return this.days.is_selected_unit;
                }
                isChecked = (i:number)=>{
                    return this.days.selected.includes(i.toString());
                }
                break;
            case 'months':
                isEnabled = (i:number)=>{
                    return this.months.is_selected;
                }
                isChecked = (i:number)=>{
                    return this.months.selected.includes(i.toString());
                }
                break;
            case 'years':
                isEnabled = (i:number)=>{
                    return this.years.is_selected;
                }
                isChecked = (i:number)=>{
                    return this.years.selected.includes(i.toString());
                }
                cssclass = 'ybox';
                break;
            default:
                isEnabled = (i:number)=>{
                    console.log('unexpected behaivor reached');
                    return true;
                }
                break;
        }

        return html`
            ${list.map(i => {
                return html`
                    <vaadin-checkbox 
                        class="${cssclass}" 
                        value="${i}" 
                        label="${i}" 
                        .disabled="${!isEnabled(i)}" 
                        .checked="${isChecked(i)}"></vaadin-checkbox>
                `;
            })}
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
