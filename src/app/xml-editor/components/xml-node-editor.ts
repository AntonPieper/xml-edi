import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { XmlNode, createNode, createAttribute } from '../models/xml-node';
import { XmlControlMapping } from '../models/xml-editor-config';
import { XmlAttributeEditor } from './xml-attribute-editor';

const DEPTH_COLORS = [
  '#00bcd4',
  '#26a69a',
  '#66bb6a',
  '#ffa726',
  '#ef5350',
  '#ab47bc',
  '#5c6bc0',
  '#ec407a',
];

@Component({
  selector: 'xml-node-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './xml-node-editor.html',
  styleUrl: './xml-node-editor.css',
  imports: [
    XmlNodeEditor,
    XmlAttributeEditor,
    NgComponentOutlet,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
  ],
})
export class XmlNodeEditor {
  node = input.required<XmlNode>();
  nodeChange = output<XmlNode>();
  controls = input<XmlControlMapping[]>([]);
  readOnly = input(false);
  depth = input(0);
  removable = input(true);
  removeNode = output<void>();

  matchedControl = computed(() => {
    const n = this.node();
    for (const ctrl of this.controls()) {
      if (ctrl.match(n)) return ctrl;
    }
    return null;
  });

  controlInputs = computed(() => ({
    node: this.node(),
    readOnly: this.readOnly(),
    onChange: this.handleControlChange,
  }));

  depthColor = computed(
    () => DEPTH_COLORS[this.depth() % DEPTH_COLORS.length],
  );

  readonly handleControlChange = (updated: XmlNode) => {
    this.nodeChange.emit(updated);
  };

  updateTagName(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.nodeChange.emit({ ...this.node(), tagName: value });
  }

  updateTextContent(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    this.nodeChange.emit({ ...this.node(), textContent: value });
  }

  addAttribute() {
    const node = this.node();
    this.nodeChange.emit({
      ...node,
      attributes: [...node.attributes, createAttribute()],
    });
  }

  updateAttribute(
    attrId: string,
    change: { name: string; value: string },
  ) {
    const node = this.node();
    this.nodeChange.emit({
      ...node,
      attributes: node.attributes.map((a) =>
        a.id === attrId ? { ...a, name: change.name, value: change.value } : a,
      ),
    });
  }

  removeAttribute(attrId: string) {
    const node = this.node();
    this.nodeChange.emit({
      ...node,
      attributes: node.attributes.filter((a) => a.id !== attrId),
    });
  }

  addChild() {
    const node = this.node();
    this.nodeChange.emit({
      ...node,
      children: [...node.children, createNode('element')],
    });
  }

  onChildChange(index: number, updatedChild: XmlNode) {
    const node = this.node();
    this.nodeChange.emit({
      ...node,
      children: node.children.map((c, i) =>
        i === index ? updatedChild : c,
      ),
    });
  }

  onChildRemove(index: number) {
    const node = this.node();
    this.nodeChange.emit({
      ...node,
      children: node.children.filter((_, i) => i !== index),
    });
  }
}
