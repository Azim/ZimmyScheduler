import { LitElement, html, customElement, property } from 'lit-element';

@customElement('test-component')
export class TestComponent extends LitElement {
    @property()
    name = 'default';

    render() {
        return html`<p>Hello, ${this.name}</p>`;
    }
}