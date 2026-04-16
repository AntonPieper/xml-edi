import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { XmlNode, createAttribute } from '../models/xml-node';
import { XmlAttributeEditor } from './xml-attribute-editor';
import {
  type XmlSchemaDefinition,
  type XmlTagDefinition,
  findTagDef,
  filterTagDefs,
} from '../models/xml-schema';

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
    MatAutocompleteModule,
  ],
})
export class XmlNodeEditor {
  node = input.required<XmlNode>();
  nodeChange = output<XmlNode>();
  readOnly = input(false);
  schema = input<XmlSchemaDefinition>();
  /** Restrict tag autocomplete to these tag names (from parent's allowedChildren) */
  allowedTagNames = input<string[]>();

  /** Filter query for tag autocomplete */
  tagFilter = signal('');

  /** Current tag's definition */
  currentTagDef = computed(() =>
    findTagDef(this.schema(), this.node().tagName),
  );

  /** Available tag definitions, filtered by allowedTagNames if set */
  availableTagDefs = computed(() => {
    const s = this.schema();
    if (!s) return [];
    const allowed = this.allowedTagNames();
    if (allowed) {
      return s.tags.filter((t) => allowed.includes(t.name));
    }
    return s.tags;
  });

  /** Filtered tag defs for autocomplete dropdown */
  filteredTagDefs = computed(() =>
    filterTagDefs(this.availableTagDefs(), this.tagFilter()),
  );

  hasTagDefs = computed(() => this.availableTagDefs().length > 0);

  /** Attribute definitions for current tag */
  attrDefs = computed(() => this.currentTagDef()?.attributes ?? []);

  updateTagName(value: string) {
    this.tagFilter.set(value);
    this.nodeChange.emit({ ...this.node(), tagName: value });
  }

  onTagInput(event: Event) {
    this.updateTagName((event.target as HTMLInputElement).value);
  }

  onTagSelected(name: string) {
    this.updateTagName(name);
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
