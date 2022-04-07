import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
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

import * as cronParser from '@joshoy/quartz-cron-parser';


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
};

function allowEveryHour(minutes:units){
    if(minutes.selected.length<2) return true;
    return Math.abs(Number(minutes.selected[0]) - Number(minutes.selected[minutes.selected.length-1])) == 30;
}
function areHoursNextToEachOther(hours:units){
    if(hours.is_every_unit||hours.is_range_unit) return true;
    if(hours.is_every_x_unit&&hours.every_x=='1') return true;
    if(hours.is_selected_unit){
        if(hours.selected.length<2) return false;
        let near = false;
        for(let i = 0; i< hours.selected.length; i++){
            let a = hours.selected[i];
            if(i==hours.selected.length-1){
                let b = hours.selected[0];
                if(b=='0'&&a=='23'||b=='23'&&a=='0'){
                    near = true;
                }
            }else{
                let b = hours.selected[i+1];
                if(Number(b)-Number(a)==1){
                    near = true;
                }
            }
        }
        return near;
    }
    return false;
}

function getFullName(weekday:string|number){
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
function getShortName(weekday:number){
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
function getDayNumber(weekday:string){
    switch (weekday) {
        case 'Sunday':
        case 'SUN':
            return 1;
        case 'Monday':
        case 'MON':
            return 2;
        case 'Tuesday':
        case 'TUE':
            return 3;
        case 'Wednesday':
        case 'WED':
            return 4;
        case 'Thursday':
        case 'THU':
            return 5;
        case 'Friday':
        case 'FRI':
            return 6;
        case 'Saturday':
        case 'SAT':
            return 7;
        default:
            return weekday;
    }
}

export function readableExpressionLabel(expression:string){
    let error = getErrorMessage(expression);
    return html`
        <div slot = "label">
            ${error.length==0 
                ?
                cronstrue.toString(expression, { use24HourTimeFormat: true, verbose:true, throwExceptionOnParseError:false, dayOfWeekStartIndexZero:false })
                :
                error
            }
        </div>
    `;
}

function getErrorMessage(expression:string){
    let parts = expression.trim().split(' ');
    if(parts.length!=7){
        return 'Invalid expression (must be 7 sections)';
    }
    let parseResult = cronParser.parse(expression);
    if(parseResult.error!=null){
        return 'Invalid expression';
    }
    if(!doesMatchLimits(expression)){
        return 'Minimum allowed time between executions is 30 minutes';
    }
    return '';
}

function doesMatchLimits(input:string){
    let parts = input.split(' ');
    if(parts.length != 7) return false;
    let seconds = parts[0];
    if(seconds.includes('*')||seconds.includes('-')||seconds.includes('/')||seconds.includes(',')) return false;
    let minutes = parts[1];
    if(minutes.includes('*')||minutes.includes('-')) return false;
    if(minutes.includes('/'))
        if(Number(minutes.split('/')[1])<30) return false;
    let allowHoursNear = true;
    if(minutes.includes(',')){
        let mins = minutes.split(',');
        if(mins.length>2) return false;
        mins.sort();
        let diff = Math.abs(Number(mins[0]) - Number(mins[mins.length-1]));
        allowHoursNear = (diff == 30);
        if(diff<30) return false;
    }
    if (!allowHoursNear) {
        let hours = parts[2];
        if (hours.includes('*') || hours.includes('-')) return false;

        if (hours.includes("/"))
            if (Number(hours.split("/")[1]) < 2) return false;

        if (hours.includes(",")) {
            let hs = hours.split(',');
            if (hs.includes('0') && hs.includes('23')) return false;
            hs.sort();
            for(let i = 0; i< hs.length-1; i++){
                let a = hs[i];
                let b = hs[i+1];
                if(Math.abs(Number(b)-Number(a))==1){
                    return false;
                }
            }
        }
    }
    return true;
}

@customElement('quartz-cron')
export class QuartzCron extends LitElement {

    @property({type:Boolean, hasChanged:(oldValue:string, newValue:string)=>{
        return newValue != oldValue;
    }})
    expression:string='0 0 0 ? * * *';

    selectedTab:number=0;

    private seconds:number=0;
    private minutes:units ={
        selected: ['0'],
        is_every_unit: false,
        every_x: '',
        every_x_start: '',
        range_a: '',
        range_b: '',
        is_every_x_unit: false,
        is_selected_unit: true,
        is_range_unit: false
    };
    private hours:units = {
        selected: ['0'],
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
        selected_week: ['MON'],
        is_selected_unit: false,
        selected: ['1'],

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
        selected: Array<string>('JAN')
    };
    private years = {
        is_every_year: true,
        is_selected: false,
        selected:Array<string>('2022')
    };
    
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
        .hidden{
            display: none;
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
                id="builder-cron-output"
                style="width: 100%;"
                .value="${this.expression}"
            readonly>
                ${readableExpressionLabel(this.expression)}
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

    updateExpression(){
        let parts = [];
        parts[0] = this.seconds+'';
        let buildUnit = (u:units)=>{
            if(u.is_selected_unit){
                if(u.selected.length==0) return '0';
                return u.selected.join(',');
            }
            if(u.is_every_unit) return '*';
            if(u.is_range_unit) return u.range_a+'-'+u.range_b;
            if(u.is_every_x_unit) return u.every_x_start+'/'+u.every_x;

            console.log(u);
            throw 'I forgot something!';
        };
        parts[1] = buildUnit(this.minutes);
        parts[2] = buildUnit(this.hours);

        parts[3] = '?';
        parts[5] = '?';
        if(this.days.is_every_unit){
            parts[5] = '*';
        }else if(this.days.is_every_x_week){
            parts[5] = getDayNumber(this.days.every_x_start_week)+'/'+this.days.every_x_week;
        }else if(this.days.is_every_x_unit){
            parts[3] = this.days.every_x_start+'/'+this.days.every_x;
        }else if(this.days.is_selected_week){
            if(this.days.selected_week.length==0){
                parts[5] = 'MON';
            }else{
                parts[5] = this.days.selected_week.join(',');
            }
        }else if(this.days.is_selected_unit){
            if(this.days.selected.length==0){
                parts[3] = '1';
            }else{
                parts[3] = this.days.selected.join(',');
            }
        }else if(this.days.is_range_week){
            parts[5] = getDayNumber(this.days.range_week_a)+'-'+getDayNumber(this.days.range_week_b);
        }else if(this.days.is_range_unit){
            parts[3] = this.days.range_a+"-"+this.days.range_b;
        }else if(this.days.is_last_day){
            parts[3] = 'L';
        }else if(this.days.is_last_mon_fri){
            parts[3] = 'LW';
        }else if(this.days.is_last_weekday){
            parts[5] = getDayNumber(this.days.last_weekday)+'L';
        }else if(this.days.is_x_days_before_end){
            parts[3] = 'L-'+this.days.x_day_before_end;
        }else if(this.days.is_nearest_weekday){
            parts[3] = this.days.nearest_weekday_to+'W';
        }else if(this.days.is_x_th_weekday){
            parts[5] = getDayNumber(this.days.x_th_weekday)+'#'+this.days.x_th_day;
        }

        if(this.months.is_every_month){
            parts[4] = '*';
        }else if(this.months.is_selected){
            if(this.months.selected.length==0){
                parts[4] = 'JAN';
            }else{
                parts[4] = this.months.selected.join(',');
            }
        }

        if(this.years.is_every_year){
            parts[6] = '*';
        }else if(this.years.is_selected){
            if(this.years.selected.length==0){
                parts[6] = '2022';
            }else{
                parts[6] = this.years.selected.join(',');
            }
        }
        this.expression = parts.join(' ');
        this.requestUpdate();
    }

    buildContent(){
        let allowEveryHourRes = allowEveryHour(this.minutes);
        let hoursInterval = this.range(1,25).map(i=>{ //every X hours, cant do every 0 hours so offset by one
            return {
                label: i.toString(),
                value: i.toString(),
                disabled: i==1 && !allowEveryHourRes, //cant do every hour to abide the limits
            }
        });

        let hoursIndex = this.range(0,24).map(i=>{ 
            return {
                label: i.toString(),
                value: i.toString(),
            }
        });

        let handleChoiceHour = (i:number)=>{
            if(!allowEveryHourRes){
                if(i==0||i==3) return;
            }
            this.hours.is_every_unit = i==0;
            this.hours.is_every_x_unit = i==1;
            this.hours.is_selected_unit = i==2;
            this.hours.is_range_unit = i==3;
            this.updateExpression();
        };

        if(this.hours.every_x=='1' && !allowEveryHourRes){
            this.hours.every_x = '2';
        }
        let currentHourInterval = this.hours.every_x;

        let daysInterval = this.range(1,32).map(i=>{ //every X days
            return {
                label: i.toString(),
                value: i.toString(),
            }
        });
        let daysIndex = this.range(1,32).map(i=>{ 
            let label = i.toString();
            if(i % 10 == 1 && i != 11){
                label += 'st';
            }else if(i % 10 == 2 && i != 12){
                label += 'nd';
            }else if(i % 10 == 3 && i != 13){
                label += 'rd';
            }else{
                label += 'th';
            }
            return {
                label: label,
                value: i.toString(),
            }
        });
        let weekdaysInterval = this.range(1,8).map(i=>{
            return {
                label: i.toString(),
                value: i.toString(),
            }
        });
        let weekdaysIndex = this.range(1,8).map(i=>{
            return {
                label: getFullName(i),
                value: getShortName(i),
            }
        });

        let monthsIndex = [
            {
                label: 'January',
                value: 'JAN',
            },
            {
                label: 'February',
                value: 'FEB',
            },
            {
                label: 'March',
                value: 'MAR',
            },
            {
                label: 'April',
                value: 'APR',
            },
            {
                label: 'May',
                value: 'MAY',
            },
            {
                label: 'June',
                value: 'JUN',
            },
            {
                label: 'July',
                value: 'JUL',
            },
            {
                label: 'August',
                value: 'AUG',
            },
            {
                label: 'September',
                value: 'SEP',
            },
            {
                label: 'October',
                value: 'OCT',
            },
            {
                label: 'November',
                value: 'NOV',
            },
            {
                label: 'December',
                value: 'DEC',
            },
        ];

        let handleChoiceWeekday = (i:number)=>{    //[0-6]
            this.days.is_every_unit = i==0; //every day //both
            this.days.is_every_x_week = i==1; //every x days starting on sunday
            this.days.is_selected_week = i==2; //specific day of the week
            this.days.is_range_week = i==3; //every day between days of the week
            this.days.is_last_mon_fri = i==4; // last weekday of the month
            this.days.is_last_weekday = i==5; //on the last [week day] of the month
            this.days.is_x_th_weekday = i==6; //on the Xth [weekday] of the month //both
        };
        let handleChoiceDay = (i:number)=>{    //[0-7]
            this.days.is_every_unit = i==0; //every day //both
            this.days.is_every_x_unit = i==1; //every x days starting on 1st of the month
            this.days.is_selected_unit = i==2; //specific day of the month
            this.days.is_range_unit = i==3;   //every day between the A and B of the month
            this.days.is_last_day = i==4;       //last day of the month
            this.days.is_x_days_before_end = i==5;  //x days before the end of the month
            this.days.is_nearest_weekday = i==6; //on the nearest weekday(monday to friday) to the xth of the month
            this.days.is_x_th_weekday = i==7; //on the Xth [weekday] of the month //both
        };
        let handleChoice = (i:number, month:boolean)=>{
            if(month){
                handleChoiceWeekday(-1);
                handleChoiceDay(i);
            }else{
                handleChoiceDay(-1);
                handleChoiceWeekday(i);
            }
            this.updateExpression();
        };
        return html`
            <div class="${this.selectedTab==0?'':'hidden'}">
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
                            this.updateExpression();
                        }}"
                    ></vaadin-integer-field>
                </vaadin-form-item>
            </div>
            <div class="${this.selectedTab==1?'':'hidden'}">
                <vaadin-checkbox-group 
                    style="flex-wrap:wrap;" 
                    label="Specific minute (choose one or many)"
                    .value="${this.minutes.selected}"
                    @value-changed="${(e: CustomEvent) => {
                        this.minutes.selected = e.detail.value;
                        this.updateExpression();
                    }}"
                >
                    ${this.buildCheckboxes('minutes',this.range(0,60))}
                </vaadin-checkbox-group>
            </div>
            <div class="${this.selectedTab==2?'':'hidden'}">
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
                    <vaadin-select
                        class="hour-select"
                        .items = "${this.hours.is_every_x_unit ? hoursInterval : [{label:currentHourInterval, value:currentHourInterval}]}"
                        .value = "${currentHourInterval}"
                        .disabled = "${!this.hours.is_every_x_unit}"
                        @value-changed="${(e: CustomEvent) => {
                            this.hours.every_x = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select>
                    <span class="choice-text" @click="${(e:any)=>(handleChoiceHour(1))}">
                        hour(s) starting at hour
                    </span>
                    <vaadin-select
                        class="hour-select"
                        .items = "${this.hours.is_every_x_unit ? hoursIndex : [{label:this.hours.every_x_start, value:this.hours.every_x_start}]}"
                        .value = "${this.hours.every_x_start}"
                        .disabled = "${!this.hours.is_every_x_unit}"
                        @value-changed="${(e: CustomEvent) => {
                            this.hours.every_x_start = e.detail.value;
                            this.updateExpression();
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
                        this.updateExpression();
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
                    <vaadin-select
                        class="hour-select"
                        .items = "${this.hours.is_range_unit ? hoursIndex : [{label:this.hours.range_a, value:this.hours.range_a}]}"
                        .value = "${this.hours.range_a}"
                        .disabled = "${!this.hours.is_range_unit}"
                        @value-changed="${(e: CustomEvent) => {
                            this.hours.range_a = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select> 
                    <span class="choice-text" @click="${(e:any)=>(handleChoiceHour(3))}">
                        and hour
                    </span>
                    <vaadin-select
                        class="hour-select"
                        .items = "${this.hours.is_range_unit ? hoursIndex : [{label:this.hours.range_b, value:this.hours.range_b}]}"
                        .value = "${this.hours.range_b}"
                        .disabled = "${!this.hours.is_range_unit}"
                        @value-changed="${(e: CustomEvent) => {
                            this.hours.range_b = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select>
                </div>
            </div>
            <div class="${this.selectedTab==3?'':'hidden'}">
                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.days.is_every_unit}"
                        @input="${(e:any)=>(handleChoice(0,false))}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(0,false))}">
                        Every day
                    </span>
                </div>

                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.days.is_every_x_week}"
                        @input="${(e:any)=>(handleChoice(1,false))}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(1,false))}">
                        Every
                    </span>
                    <vaadin-select
                        class="hour-select"
                        .items = "${this.days.is_every_x_week ? weekdaysInterval : [{label:this.days.every_x_week, value:this.days.every_x_week}]}"
                        .value = "${this.days.every_x_week}"
                        .disabled = "${!this.days.is_every_x_week}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.every_x_week = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(1,false))}">
                        day(s) starting on
                    </span>
                    <vaadin-select
                        class="day-select"
                        .items = "${this.days.is_every_x_week ? weekdaysIndex : [{label:getFullName(this.days.every_x_start_week), value:this.days.every_x_start_week}]}"
                        .value = "${this.days.every_x_start_week}"
                        .disabled = "${!this.days.is_every_x_week}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.every_x_start_week = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select> 
                </div>

                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.days.is_selected_week}"
                        @input="${(e:any)=>(handleChoice(2,false))}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(2,false))}">
                        Specific day of week (choose one or many)
                    </span>
                </div>
                <vaadin-checkbox-group 
                    style="flex-wrap:wrap;"
                    .value="${this.days.selected_week}"
                    .disabled="${!this.days.is_selected_week}"
                    @value-changed="${(e: CustomEvent) => {
                        this.days.selected_week = e.detail.value;
                        this.updateExpression();
                    }}"
                >
                    ${this.buildDaysCheckboxes(weekdaysIndex)}
                </vaadin-checkbox-group>

                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.days.is_range_week}"
                        @input="${(e:any)=>(handleChoice(3,false))}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(3,false))}">
                        Every day between
                    </span>
                    <vaadin-select
                        class="day-select"
                        .items = "${this.days.is_range_week ? weekdaysIndex : [{label:getFullName(this.days.range_week_a), value:this.days.range_week_a}]}"
                        .value = "${this.days.range_week_a}"
                        .disabled = "${!this.days.is_range_week}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.range_week_a = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(3,false))}">
                        and
                    </span>
                    <vaadin-select
                        class="day-select"
                        .items = "${this.days.is_range_week ? weekdaysIndex : [{label:getFullName(this.days.range_week_b), value:this.days.range_week_b}]}"
                        .value = "${this.days.range_week_b}"
                        .disabled = "${!this.days.is_range_week}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.range_week_b = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select> 
                </div>

                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.days.is_last_mon_fri}"
                        @input="${(e:any)=>(handleChoice(4,false))}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(4,false))}">
                        On the last weekday (Monday-Friday) of the month
                    </span>
                </div>

                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.days.is_last_weekday}"
                        @input="${(e:any)=>(handleChoice(5,false))}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(5,false))}">
                        On the last
                    </span>
                    <vaadin-select
                        class="day-select"
                        .items = "${this.days.is_last_weekday ? weekdaysIndex : [{label:getFullName(this.days.last_weekday), value:this.days.last_weekday}]}"
                        .value = "${this.days.last_weekday}"
                        .disabled = "${!this.days.is_last_weekday}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.last_weekday = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(5,false))}">
                        of the month
                    </span>
                </div>

                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.days.is_x_th_weekday}"
                        @input="${(e:any)=>(handleChoice(6,false))}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(6,false))}">
                        On the 
                    </span>
                    <vaadin-select
                        class="day-select-small"
                        .items = "${this.days.is_x_th_weekday ? daysIndex.slice(0,5) : [ daysIndex[Number(this.days.x_th_day)-1] ]}"
                        .value = "${this.days.x_th_day}"
                        .disabled = "${!this.days.is_x_th_weekday}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.x_th_day = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select> 
                    <vaadin-select
                        class="day-select"
                        .items = "${this.days.is_x_th_weekday ? weekdaysIndex : [{label:getFullName(this.days.x_th_weekday), value:this.days.x_th_weekday}]}"
                        .value = "${this.days.x_th_weekday}"
                        .disabled = "${!this.days.is_x_th_weekday}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.x_th_weekday = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(6,false))}">
                        of the month
                    </span>
                </div>
            </div>
            <div class="${this.selectedTab==4?'':'hidden'}">
                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.days.is_every_unit}"
                        @input="${(e:any)=>(handleChoice(0,true))}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(0,true))}">
                        Every day
                    </span>
                </div>

                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.days.is_every_x_unit}"
                        @input="${(e:any)=>(handleChoice(1,true))}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(1,true))}">
                        Every
                    </span>
                    <vaadin-select
                        class="hour-select"
                        .items = "${this.days.is_every_x_unit ? daysInterval : [{label:this.days.every_x, value:this.days.every_x}]}"
                        .value = "${this.days.every_x}"
                        .disabled = "${!this.days.is_every_x_unit}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.every_x = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(1,true))}">
                        day(s) starting on the
                    </span>
                    <vaadin-select
                        class="day-select-small"
                        .items = "${this.days.is_every_x_unit ? daysIndex : [ daysIndex[Number(this.days.every_x_start)-1] ]}"
                        .value = "${this.days.every_x_start}"
                        .disabled = "${!this.days.is_every_x_unit}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.every_x_start = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select> 
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(1,true))}">
                        of the month
                    </span>
                </div>

                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.days.is_selected_unit}"
                        @input="${(e:any)=>(handleChoice(2,true))}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(2,true))}">
                        Specific day of month (choose one or many)
                    </span>
                </div>
                <vaadin-checkbox-group 
                    style="flex-wrap:wrap;"
                    .value="${this.days.selected}"
                    .disabled="${!this.days.is_selected_unit}"
                    @value-changed="${(e: CustomEvent) => {
                        this.days.selected = e.detail.value;
                        this.updateExpression();
                    }}"
                >
                    ${this.buildCheckboxes('days',this.range(1,32))}
                </vaadin-checkbox-group>
                
                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.days.is_range_unit}"
                        @input="${(e:any)=>(handleChoice(3,true))}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(3,true))}">
                        Every day between the
                    </span>
                    <vaadin-select
                        class="day-select"
                        .items = "${this.days.is_range_unit ? daysIndex : [ daysIndex[Number(this.days.range_a)-1] ]}"
                        .value = "${this.days.range_a}"
                        .disabled = "${!this.days.is_range_unit}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.range_a = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(3,true))}">
                        and
                    </span>
                    <vaadin-select
                        class="day-select"
                        .items = "${this.days.is_range_unit ? daysIndex : [ daysIndex[Number(this.days.range_b)-1] ]}"
                        .value = "${this.days.range_b}"
                        .disabled = "${!this.days.is_range_unit}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.range_b = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select> 
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(3,true))}">
                        of the month
                    </span>
                </div>

                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.days.is_last_day}"
                        @input="${(e:any)=>(handleChoice(4,true))}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(4,true))}">
                        On the last day of the month
                    </span>
                </div>
                
                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.days.is_x_days_before_end}"
                        @input="${(e:any)=>(handleChoice(5,true))}"
                    ></vaadin-radio-button>
                    <vaadin-select
                        class="hour-select"
                        .items = "${this.days.is_x_days_before_end ? daysInterval : [{label:this.days.x_day_before_end, value:this.days.x_day_before_end}]}"
                        .value = "${this.days.x_day_before_end}"
                        .disabled = "${!this.days.is_x_days_before_end}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.x_day_before_end = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(5,true))}">
                        day(s) before the end of the month
                    </span>
                </div>

                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.days.is_nearest_weekday}"
                        @input="${(e:any)=>(handleChoice(6,true))}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(6,true))}">
                        Nearest weekday (Monday to Friday) to the
                    </span>
                    <vaadin-select
                        class="day-select-small"
                        .items = "${this.days.is_nearest_weekday ? daysIndex : [ daysIndex[Number(this.days.nearest_weekday_to)-1] ]}"
                        .value = "${this.days.nearest_weekday_to}"
                        .disabled = "${!this.days.is_nearest_weekday}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.nearest_weekday_to = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select> 
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(6,true))}">
                        of the month
                    </span>
                </div>

                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.days.is_x_th_weekday}"
                        @input="${(e:any)=>(handleChoice(7,true))}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(7,true))}">
                        On the 
                    </span>
                    <vaadin-select
                        class="day-select-small"
                        .items = "${this.days.is_x_th_weekday ? daysIndex.slice(0,5) : [ daysIndex[Number(this.days.x_th_day)-1] ]}"
                        .value = "${this.days.x_th_day}"
                        .disabled = "${!this.days.is_x_th_weekday}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.x_th_day = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select> 
                    <vaadin-select
                        class="day-select"
                        .items = "${this.days.is_x_th_weekday ? weekdaysIndex : [{label:getFullName(this.days.x_th_weekday), value:this.days.x_th_weekday}]}"
                        .value = "${this.days.x_th_weekday}"
                        .disabled = "${!this.days.is_x_th_weekday}"
                        @value-changed="${(e: CustomEvent) => {
                            this.days.x_th_weekday = e.detail.value;
                            this.updateExpression();
                        }}"
                    ></vaadin-select>
                    <span class="choice-text" @click="${(e:any)=>(handleChoice(7,true))}">
                        of the month
                    </span>
                </div>
            </div>
            <div class="${this.selectedTab==5?'':'hidden'}">
                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.months.is_every_month}"
                        @input="${(e:any)=>{
                            this.months.is_every_month = true;
                            this.months.is_selected = false;
                            this.updateExpression();
                        }}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>{
                            this.months.is_every_month = true;
                            this.months.is_selected = false;
                            this.updateExpression();
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
                            this.updateExpression();
                        }}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>{
                            this.months.is_every_month = false;
                            this.months.is_selected = true;
                            this.updateExpression();
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
                        this.updateExpression();
                    }}"
                >
                    ${this.buildMonthCheckboxes(monthsIndex)}
                </vaadin-checkbox-group>
            </div>
            <div class="${this.selectedTab==6?'':'hidden'}">
                <div class="baseline">
                    <vaadin-radio-button 
                        .checked="${this.years.is_every_year}"
                        @input="${(e:any)=>{
                            this.years.is_every_year = true;
                            this.years.is_selected = false;
                            this.updateExpression();
                        }}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>{
                            this.years.is_every_year = true;
                            this.years.is_selected = false;
                            this.updateExpression();
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
                            this.updateExpression();
                        }}"
                    ></vaadin-radio-button>
                    <span class="choice-text" @click="${(e:any)=>{
                            this.years.is_every_year = false;
                            this.years.is_selected = true;
                            this.updateExpression();
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
                        this.updateExpression();
                    }}"
                >
                    ${this.buildCheckboxes('years',this.range(2022,2046))}
                </vaadin-checkbox-group>
            </div>
        `;
    }

    buildMonthCheckboxes(values: {label:string; value:string;}[]){
        let isChecked = (val:string)=>{
            return this.months.selected.includes(val);
        }
        return html`
            ${values.map(i => {
                return html`
                    <vaadin-checkbox 
                        class="mbox" 
                        value="${i.value}" 
                        label="${i.label}" 
                        .checked="${isChecked(i.value)}"></vaadin-checkbox>
                `;
            })}
        `;
    }

    buildDaysCheckboxes(values: {label:string; value:string;}[]){
        let isChecked = (val:string)=>{
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
        let isEnabled: (i: number) => boolean;
        let isChecked: (i: number) => boolean;
        let cssclass = 'cbox';
        switch (type) {
            case 'minutes':
                isEnabled = (i:number)=>{
                    let first = Number(this.minutes.selected[0]);
                    let diff = Math.abs(i-first);
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
                    let isNear = false;
                    for(let j = 0; j< this.hours.selected.length; j++){
                        if(Math.abs(Number(this.hours.selected[j])-i)<2){
                            isNear = true;
                            break;
                        }
                        if((Number(this.hours.selected[j])==0&&i==23) || (Number(this.hours.selected[j])==23&&i==0)){
                            isNear = true;
                            break;
                        }
                    }
                    return !isNear;
                }
                isChecked = (i:number)=>{
                    return this.hours.selected.includes(i.toString());
                }
                break;
            case 'days':
                isChecked = (i:number)=>{
                    return this.days.selected.includes(i.toString());
                }
                isEnabled = (i:number)=>{
                    return true;
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
                    console.log('unexpected behaivor reached:', type);
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
        let list = [];
        for (let i = from; i < to; i++) {
            list.push(i);
        }
        return list;
    }
}
