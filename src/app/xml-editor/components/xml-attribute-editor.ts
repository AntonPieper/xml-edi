import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { XmlAttribute } from '../models/xml-node';

@Component({
  selector: 'xml-attribute-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  styles: `
    :host {
      display: block;
    }
    .attribute-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .attr-name-field {
      flex: 0 0 35%;
    }
    .attr-value-field {
      flex: 1;
    }
    .equals {
      font-family: 'Fira Code', monospace;
      font-weight: 700;
      font-size: 1.1em;
      color: var(--xml-bracket-color, #78909c);
      padding-bottom: 20px;
    }
    .remove-attr-btn {
      color: #ef5350;
      margin-bottom: 20px;
    }
    input {
      font-family: 'Fira Code', monospace;
      font-size: 0.9em;
    }
  `,
  template: `
    <div class="attribute-row">
      <mat-form-field appearance="outline" class="attr-name-field">
        <mat-label>Name</mat-label>
        <input
          matInput
          [value]="attribute().name"
          (input)="onNameChange(nameInput.value)"
          #nameInput
          [readonly]="readOnly()"
          spellcheck="false"
        />
      </mat-form-field>

      <span class="equals">=</span>

      <mat-form-field appearance="outline" class="attr-value-field">
        <mat-label>Value</mat-label>
        <input
          matInput
          [value]="attribute().value"
          (input)="onValueChange(valueInput.value)"
          #valueInput
          [readonly]="readOnly()"
        />
      </mat-form-field>

      @if (!readOnly()) {
        <button
          mat-icon-button
          (click)="remove.emit()"
          matTooltip="Remove attribute"
          class="remove-attr-btn"
        >
          <mat-icon>close</mat-icon>
        </button>
      }
    </div>
  `,
})
export class XmlAttributeEditor {
  attribute = input.required<XmlAttribute>();
  readOnly = input(false);
  attributeChange = output<{ name: string; value: string }>();
  remove = output<void>();

  onNameChange(name: string) {
    this.attributeChange.emit({ name, value: this.attribute().value });
  }

  onValueChange(value: string) {
    this.attributeChange.emit({ name: this.attribute().name, value });
  }
}
