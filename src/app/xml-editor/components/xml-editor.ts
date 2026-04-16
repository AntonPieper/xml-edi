import {
  Component,
  ChangeDetectionStrategy,
  input,
  model,
  computed,
  signal,
  viewChild,
  linkedSignal,
  ElementRef,
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { XmlNode, createNode } from '../models/xml-node';
import type { XmlControlMapping } from '../models/xml-editor-config';
import {
  updateNodeInTree,
  resolveNodeByPath,
  buildBreadcrumbs,
} from '../models/xml-tree-utils';
import { serializeXml, parseXml } from '../services/xml-serializer';
import { XmlNodeEditor } from './xml-node-editor';
import { XmlChildEditor } from './xml-child-editor';

@Component({
  selector: 'xml-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './xml-editor.html',
  styleUrl: './xml-editor.css',
  imports: [
    XmlNodeEditor,
    XmlChildEditor,
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

  /** Path of child IDs from root to current node */
  currentPath = linkedSignal<XmlNode, string[]>({
    source: this.document,
    computation: (doc, previous) => {
      const prev = previous?.value ?? [];
      let current = doc;
      const valid: string[] = [];
      for (const id of prev) {
        const child = current.children.find((c) => c.id === id);
        if (!child) break;
        valid.push(id);
        current = child;
      }
      return valid;
    },
  });

  currentNode = computed(() =>
    resolveNodeByPath(this.document(), this.currentPath()),
  );

  breadcrumbs = computed(() =>
    buildBreadcrumbs(this.document(), this.currentPath()),
  );

  isAtRoot = computed(() => this.currentPath().length === 0);

  parentName = computed(() => {
    const crumbs = this.breadcrumbs();
    return crumbs.length >= 2 ? crumbs[crumbs.length - 2].tagName : '';
  });

  xmlOutput = computed(() => serializeXml(this.document()));

  constructor(private snackBar: MatSnackBar) {}

  // ── Navigation ──

  navigateBack() {
    this.currentPath.update((p) => p.slice(0, -1));
  }

  navigateToBreadcrumb(index: number) {
    if (index === 0) {
      this.currentPath.set([]);
    } else {
      this.currentPath.update((p) => p.slice(0, index));
    }
  }

  navigateIntoChild(childId: string) {
    this.currentPath.update((p) => [...p, childId]);
  }

  // ── Current node updates ──

  updateCurrentNode(updated: XmlNode) {
    const nodeId = this.currentNode().id;
    this.document.update((doc) =>
      updateNodeInTree(doc, nodeId, () => updated),
    );
  }

  // ── Child updates (inline editing) ──

  updateChildInline(childId: string, updated: XmlNode) {
    const node = this.currentNode();
    this.updateCurrentNode({
      ...node,
      children: node.children.map((c) =>
        c.id === childId ? updated : c,
      ),
    });
  }

  addChild() {
    const node = this.currentNode();
    this.updateCurrentNode({
      ...node,
      children: [...node.children, createNode('element')],
    });
  }

  removeChild(childId: string) {
    const node = this.currentNode();
    this.updateCurrentNode({
      ...node,
      children: node.children.filter((c) => c.id !== childId),
    });
  }

  // ── Import / Export ──

  copyXml() {
    navigator.clipboard
      .writeText(this.xmlOutput())
      .then(() =>
        this.snackBar.open('Copied to clipboard', '', {
          duration: 1800,
        }),
      )
      .catch(() =>
        this.snackBar.open('Copy failed', '', { duration: 1800 }),
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
      this.importError.set('Paste XML content first');
      return;
    }
    try {
      const parsed = parseXml(xmlStr);
      this.document.set(parsed);
      this.currentPath.set([]);
      this.importVisible.set(false);
      this.importError.set('');
      this.snackBar.open('XML imported', '', { duration: 1800 });
    } catch (e: any) {
      this.importError.set(e.message || 'Invalid XML');
    }
  }
}
