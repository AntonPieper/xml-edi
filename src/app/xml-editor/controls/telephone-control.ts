import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { XmlNode } from '../models/xml-node';

@Component({
  selector: 'xml-telephone-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatInputModule, MatIconModule],
  styles: `
    :host { display: block; }
    .telephone-control {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }
    .phone-icon {
      color: #546e7a;
      font-size: 24px;
      width: 24px;
      height: 24px;
      margin-top: 16px;
      flex-shrink: 0;
    }
    .phone-field { flex: 1; }
  `,
  template: `
    <div class="telephone-control">
      <mat-icon class="phone-icon">phone</mat-icon>
      <mat-form-field appearance="outline" class="phone-field">
        <mat-label>Phone Number</mat-label>
        <input
          matInput
          type="tel"
          [value]="node().textContent"
          (input)="onPhoneChange(phoneInput.value)"
          #phoneInput
          [readonly]="readOnly()"
          placeholder="+1 (555) 123-4567"
        />
      </mat-form-field>
    </div>
  `,
})
export class TelephoneControl {
  node = input.required<XmlNode>();
  readOnly = input(false);
  onChange = input.required<(node: XmlNode) => void>();

  formattedPhone = computed(() => {
    const raw = this.node().textContent.replace(/\D/g, '');
    if (raw.length === 11 && raw.startsWith('1')) {
      return `+1 (${raw.slice(1, 4)}) ${raw.slice(4, 7)}-${raw.slice(7)}`;
    }
    if (raw.length === 10) {
      return `(${raw.slice(0, 3)}) ${raw.slice(3, 6)}-${raw.slice(6)}`;
    }
    return '';
  });

  onPhoneChange(value: string) {
    this.onChange()({ ...this.node(), textContent: value });
  }
}
