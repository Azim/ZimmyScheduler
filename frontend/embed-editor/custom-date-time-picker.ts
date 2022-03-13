import { html, LitElement } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import '@vaadin/date-picker';
import '@vaadin/date-time-picker';
import '@vaadin/time-picker';
import { DatePicker, DatePickerDate, DatePickerValueChangedEvent } from '@vaadin/date-picker';
import { DateTimePicker, DateTimePickerValueChangedEvent } from '@vaadin/date-time-picker';
import { TimePickerTime } from '@vaadin/time-picker';
//import { applyTheme } from 'Frontend/generated/theme';
import dateFnsFormat from 'date-fns/format';
import dateFnsParse from 'date-fns/parse';

@customElement('custom-date-time-picker')
export class Example extends LitElement {
  protected createRenderRoot() {
    const root = super.createRenderRoot();
    // Apply custom theme (only supported if your app uses one)
    //applyTheme(root);
    return root;
  }

  @query('vaadin-date-time-picker')
  private dateTimePicker?: DateTimePicker;

  private format:string = 'dd.MM.yyyy';

  @state()
  private selectedDateValue: string = dateFnsFormat(new Date(), this.format);

  firstUpdated() {
    const formatDateIso8601 = (dateParts: DatePickerDate): string => {
      const { year, month, day } = dateParts;
      const date = new Date(year, month, day);

      return dateFnsFormat(date, this.format);
    };

    const parseDateIso8601 = (inputValue: string): DatePickerDate => {
      const date = dateFnsParse(inputValue, this.format, new Date());

      return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() };
    };

    if (this.dateTimePicker) {
      this.dateTimePicker.i18n = {
        ...this.dateTimePicker.i18n,
        formatDate: formatDateIso8601,
        parseDate: parseDateIso8601,
      };
    }
  }

  render() {
    return html`
      <vaadin-date-time-picker
        label = "Timestamp"
        value="${this.selectedDateValue}"
        @change="${(e: DateTimePickerValueChangedEvent) => (this.selectedDateValue = e.detail.value)}"
      ></vaadin-date-picker>
    `;
  }
}