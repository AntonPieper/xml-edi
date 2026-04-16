import {
  Component,
  ChangeDetectionStrategy,
  input,
  model,
  computed,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { XmlNode } from '../models/xml-node';
import { XmlControlMapping } from '../models/xml-editor-config';
import { serializeXml, parseXml } from '../services/xml-serializer';
import { XmlNodeEditor } from './xml-node-editor';

@Component({
  selector: 'xml-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './xml-editor.html',
  styleUrl: './xml-editor.css',
  imports: [
    XmlNodeEditor,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
})
export class XmlEditor {
  document = model.required<XmlNode>();
  controls = input<XmlControlMapping[]>([]);
  readOnly = input(false);
  showPreview = input(true);

  protected importVisible = signal(false);
  protected importError = signal('');
  protected importTextarea =
    viewChild<ElementRef<HTMLTextAreaElement>>('importInput');

  xmlOutput = computed(() => serializeXml(this.document()));

  constructor(private snackBar: MatSnackBar) {}

  onDocumentChange(updated: XmlNode) {
    this.document.set(updated);
  }

  copyXml() {
    navigator.clipboard
      .writeText(this.xmlOutput())
      .then(() =>
        this.snackBar.open('XML copied to clipboard', 'OK', {
          duration: 2000,
        }),
      )
      .catch(() =>
        this.snackBar.open('Failed to copy', 'OK', { duration: 2000 }),
      );
  }

  toggleImport() {
    this.importVisible.update((v) => !v);
    this.importError.set('');
  }

  doImport() {
    const textarea = this.importTextarea();
    if (!textarea) return;
    const xmlStr = textarea.nativeElement.value;
    if (!xmlStr.trim()) {
      this.importError.set('Please paste XML content');
      return;
    }
    try {
      const parsed = parseXml(xmlStr);
      this.document.set(parsed);
      this.importVisible.set(false);
      this.importError.set('');
      this.snackBar.open('XML imported successfully', 'OK', {
        duration: 2000,
      });
    } catch (e: any) {
      this.importError.set(e.message || 'Invalid XML');
    }
  }
}
