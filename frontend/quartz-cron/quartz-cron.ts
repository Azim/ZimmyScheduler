import { css, CSSResultGroup, html, LitElement } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import '@vaadin/tabs';
import '@vaadin/vertical-layout';
import cronstrue from 'cronstrue';


@customElement('quartz-cron')
export class QuartzCron extends LitElement {

    @state()
    expression:string='';

    @state()
    selected:number=0;

    static styles = css`
        :host{
            width:fit-content;
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
    `;

    render() {
        return html`
            <vaadin-tabs 
                style = "width:100%;"
                theme="centered" 
                @selected-changed="${(e: CustomEvent) =>{
                    this.selected = e.detail.value;
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
        switch (this.selected) {
            case 0:
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
            case 1:
                return html`
                    <vaadin-checkbox-group style="flex-wrap:wrap; max-width:51em" label="Specific minute (choose one or many)">
                        ${this.buildRow(this.range(0,12))}
                        ${this.buildRow(this.range(12,24))}
                        ${this.buildRow(this.range(24,36))}
                        ${this.buildRow(this.range(36,48))}
                        ${this.buildRow(this.range(48,60))}
                    </vaadin-checkbox-group>
                `;
            default:
                return html`Which tab did you pick? we dont have that one!`;
        }
    }

    buildRow(list:number[]){
        return html`
            ${list.map((i => {
                return html`
                    <vaadin-checkbox class="cbox" value="${i}" label="${i}"></vaadin-checkbox>
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