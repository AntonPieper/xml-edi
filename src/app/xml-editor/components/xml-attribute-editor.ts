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
import { XmlAttribute } from '../models/xml-node';
import {
  type XmlAttributeDefinition,
  filterAttrDefs,
} from '../models/xml-schema';

@Component({
  selector: 'xml-attribute-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatAutocompleteModule,
  ],
  styleUrl: './xml-attribute-editor.css',
  templateUrl: './xml-attribute-editor.html',
})
export class XmlAttributeEditor {
  attribute = input.required<XmlAttribute>();
  readOnly = input(false);
  /** Available attribute definitions from schema */
  attributeDefs = input<XmlAttributeDefinition[]>([]);
  attributeChange = output<{ name: string; value: string }>();
  remove = output<void>();

  /** Filter query for autocomplete */
  nameFilter = signal('');

  filteredAttrDefs = computed(() =>
    filterAttrDefs(this.attributeDefs(), this.nameFilter()),
  );

  hasAttrDefs = computed(() => this.attributeDefs().length > 0);

  onNameInput(value: string) {
    this.nameFilter.set(value);
    this.attributeChange.emit({ name: value, value: this.attribute().value });
  }

  onNameSelected(name: string) {
    this.nameFilter.set(name);
    this.attributeChange.emit({ name, value: this.attribute().value });
  }

  onValueChange(value: string) {
    this.attributeChange.emit({ name: this.attribute().name, value });
  }
}
