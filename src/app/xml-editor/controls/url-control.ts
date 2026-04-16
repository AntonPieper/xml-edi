import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { XmlNode } from '../models/xml-node';

@Component({
  selector: 'xml-url-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  styles: `
    :host { display: block; padding: 8px 0; }
    .url-control {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .url-icon {
      color: #546e7a;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .url-field { flex: 1; }
    .open-btn { color: #546e7a; }
  `,
  template: `
    <div class="url-control">
      <mat-icon class="url-icon">link</mat-icon>
      <mat-form-field appearance="outline" class="url-field">
        <mat-label>URL</mat-label>
        <input
          matInput
          type="url"
          [value]="node().textContent"
          (input)="onUrlChange(urlInput.value)"
          #urlInput
          [readonly]="readOnly()"
          placeholder="https://example.com"
        />
      </mat-form-field>
      @if (isValidUrl()) {
        <a
          [href]="node().textContent"
          target="_blank"
          rel="noopener"
          mat-icon-button
          matTooltip="Open link"
          class="open-btn"
        >
          <mat-icon>open_in_new</mat-icon>
        </a>
      }
    </div>
  `,
})
export class UrlControl {
  node = input.required<XmlNode>();
  readOnly = input(false);
  onChange = input.required<(node: XmlNode) => void>();

  isValidUrl = computed(() => {
    try {
      new URL(this.node().textContent);
      return true;
    } catch {
      return false;
    }
  });

  onUrlChange(value: string) {
    this.onChange()({ ...this.node(), textContent: value });
  }
}
