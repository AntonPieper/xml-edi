import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { XmlNode } from '../models/xml-node';
import type { XmlControlMapping } from '../models/xml-editor-config';
import {
  type XmlSchemaDefinition,
  findTagDef,
} from '../models/xml-schema';

@Component({
  selector: 'xml-child-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgComponentOutlet,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  styleUrl: './xml-child-editor.css',
  templateUrl: './xml-child-editor.html',
})
export class XmlChildEditor {
  child = input.required<XmlNode>();
  controls = input<XmlControlMapping[]>([]);
  readOnly = input(false);
  schema = input<XmlSchemaDefinition>();
  childChange = output<XmlNode>();
  navigate = output<void>();
  remove = output<void>();

  /** Tag definition from schema (if available) */
  tagDef = computed(() =>
    findTagDef(this.schema(), this.child().tagName),
  );

  /** Display title: schema title or tag name */
  displayTitle = computed(() => this.tagDef()?.title ?? null);

  /** Leaf node or control says hideChildren → render inline */
  isInline = computed(() => {
    const c = this.child();
    if (c.children.length === 0) return true;
    const ctrl = this.matchedControl();
    return ctrl?.hideChildren === true;
  });

  matchedControl = computed(() => {
    const n = this.child();
    for (const ctrl of this.controls()) {
      if (ctrl.match(n)) return ctrl;
    }
    return null;
  });

  controlInputs = computed(() => ({
    node: this.child(),
    readOnly: this.readOnly(),
    onChange: this.handleChange,
  }));

  readonly handleChange = (updated: XmlNode) => {
    this.childChange.emit(updated);
  };

  updateContent(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.childChange.emit({ ...this.child(), textContent: value });
  }
}
