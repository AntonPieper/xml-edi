import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { XmlNode } from '../models/xml-node';

@Component({
  selector: 'xml-boolean-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSlideToggleModule, MatIconModule],
  styles: `
    :host { display: block; padding: 12px 0; }
    .boolean-control {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .bool-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .bool-icon.is-true { color: #43a047; }
    .bool-icon.is-false { color: #c62828; }
    .label-text {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.9em;
      color: #546e7a;
    }
  `,
  template: `
    <div class="boolean-control">
      <mat-icon
        class="bool-icon"
        [class.is-true]="isTrue()"
        [class.is-false]="!isTrue()"
      >
        {{ isTrue() ? 'check_circle' : 'cancel' }}
      </mat-icon>
      <mat-slide-toggle
        [checked]="isTrue()"
        (change)="onToggle($event.checked)"
        [disabled]="readOnly()"
      >
        <span class="label-text">{{ isTrue() ? 'Yes' : 'No' }}</span>
      </mat-slide-toggle>
    </div>
  `,
})
export class BooleanControl {
  node = input.required<XmlNode>();
  readOnly = input(false);
  onChange = input.required<(node: XmlNode) => void>();

  isTrue = computed(() => {
    const text = this.node().textContent.toLowerCase().trim();
    return text === 'true' || text === 'yes' || text === '1';
  });

  onToggle(checked: boolean) {
    this.onChange()({
      ...this.node(),
      textContent: checked ? 'true' : 'false',
    });
  }
}
