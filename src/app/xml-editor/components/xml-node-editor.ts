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
import { XmlNode, createAttribute } from '../models/xml-node';
import { XmlAttributeEditor } from './xml-attribute-editor';

@Component({
  selector: 'xml-node-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './xml-node-editor.html',
  styleUrl: './xml-node-editor.css',
  imports: [
    XmlAttributeEditor,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
})
export class XmlNodeEditor {
  node = input.required<XmlNode>();
  nodeChange = output<XmlNode>();
  readOnly = input(false);

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
        a.id === attrId
          ? { ...a, name: change.name, value: change.value }
          : a,
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
}
