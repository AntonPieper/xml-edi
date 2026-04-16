import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  viewChild,
  effect,
  ElementRef,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { EditorView } from '@codemirror/view';
import { EditorState, Compartment, type Extension } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { xml } from '@codemirror/lang-xml';
import { linter, lintGutter } from '@codemirror/lint';
import type { XmlSchemaDefinition } from '../models/xml-schema';
import {
  schemaToElementSpecs,
  createXmlLintSource,
} from '../services/xml-cm-schema';

/** Light theme matching the visual editor palette */
const xmlEditorTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
    fontFamily: "'IBM Plex Mono', monospace",
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-gutters': {
    backgroundColor: '#f7f9fb',
    color: '#b0bec5',
    borderRight: '1px solid #e8ecf0',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#eceff1',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(236, 239, 241, 0.4)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: '#cfd8dc !important',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#37474f',
  },
  '.cm-tooltip': {
    border: '1px solid #e8ecf0',
    borderRadius: '6px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: '#eceff1',
    color: '#37474f',
  },
  '.cm-completionDetail': {
    color: '#90a4ae',
    fontStyle: 'normal',
    marginLeft: '8px',
  },
  '.cm-completionInfo': {
    padding: '6px 10px',
    fontSize: '12px',
    color: '#546e7a',
  },
});

@Component({
  selector: 'xml-code-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #editorHost class="cm-host"></div>`,
  styleUrl: './xml-code-editor.css',
})
export class XmlCodeEditor implements AfterViewInit, OnDestroy {
  /** Serialized XML from visual editor */
  xml = input.required<string>();
  /** Schema for autocomplete + linting */
  schema = input<XmlSchemaDefinition>();
  readOnly = input(false);
  /** Emits raw XML string on user edits (debounced) */
  xmlChange = output<string>();

  private editorHost =
    viewChild.required<ElementRef<HTMLDivElement>>('editorHost');
  private view: EditorView | null = null;

  /** Cache last external XML to avoid unnecessary CM updates */
  private lastExternalXml = '';
  /** Suppress emit when applying external change */
  private suppressEmit = false;
  /** Skip next external update (after we emitted a change) */
  private ignoreNextExternal = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Compartments for dynamic reconfiguration */
  private langCompartment = new Compartment();
  private lintCompartment = new Compartment();
  private readOnlyCompartment = new Compartment();

  constructor() {
    // Sync external xml changes into CM
    effect(() => {
      const xmlVal = this.xml();
      this.applyExternalXml(xmlVal);
    });

    // Reconfigure on schema change
    effect(() => {
      const schema = this.schema();
      this.reconfigureSchema(schema);
    });

    // Reconfigure readOnly
    effect(() => {
      const ro = this.readOnly();
      this.reconfigureReadOnly(ro);
    });
  }

  ngAfterViewInit() {
    this.createEditor();
  }

  ngOnDestroy() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.view?.destroy();
    this.view = null;
  }

  // ── Editor lifecycle ──

  private createEditor() {
    const schema = this.schema();
    const initialXml = this.xml();

    this.view = new EditorView({
      parent: this.editorHost().nativeElement,
      state: EditorState.create({
        doc: initialXml,
        extensions: [
          basicSetup,
          this.langCompartment.of(this.buildLangExt(schema)),
          this.lintCompartment.of(this.buildLintExt(schema)),
          this.readOnlyCompartment.of(
            EditorState.readOnly.of(this.readOnly()),
          ),
          xmlEditorTheme,
          lintGutter(),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !this.suppressEmit) {
              this.scheduleEmit();
            }
          }),
        ],
      }),
    });

    this.lastExternalXml = initialXml;
  }

  // ── Extension builders ──

  private buildLangExt(schema?: XmlSchemaDefinition) {
    return xml(
      schema ? { elements: schemaToElementSpecs(schema) } : {},
    );
  }

  private buildLintExt(schema?: XmlSchemaDefinition): Extension {
    return linter(createXmlLintSource(schema));
  }

  // ── Sync: external → CM ──

  private applyExternalXml(xmlVal: string) {
    if (!this.view) return;
    if (this.ignoreNextExternal) {
      this.ignoreNextExternal = false;
      this.lastExternalXml = xmlVal;
      return;
    }
    if (xmlVal === this.lastExternalXml) return;
    this.lastExternalXml = xmlVal;
    this.suppressEmit = true;
    this.view.dispatch({
      changes: {
        from: 0,
        to: this.view.state.doc.length,
        insert: xmlVal,
      },
    });
    this.suppressEmit = false;
  }

  // ── Sync: CM → external ──

  private scheduleEmit() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (!this.view) return;
      // sliceString(from, to) — efficient range read, not toString()
      const text = this.view.state.doc.sliceString(0);
      this.ignoreNextExternal = true;
      this.lastExternalXml = text;
      this.xmlChange.emit(text);
    }, 300);
  }

  // ── Reconfiguration ──

  private reconfigureSchema(schema?: XmlSchemaDefinition) {
    if (!this.view) return;
    this.view.dispatch({
      effects: [
        this.langCompartment.reconfigure(this.buildLangExt(schema)),
        this.lintCompartment.reconfigure(this.buildLintExt(schema)),
      ],
    });
  }

  private reconfigureReadOnly(ro: boolean) {
    if (!this.view) return;
    this.view.dispatch({
      effects: this.readOnlyCompartment.reconfigure(
        EditorState.readOnly.of(ro),
      ),
    });
  }
}
