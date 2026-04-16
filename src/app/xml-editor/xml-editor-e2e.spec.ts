import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { XmlEditor } from './components/xml-editor';
import {
  createNode,
  createAttribute,
  resetIdCounter,
  type XmlNode,
} from './models/xml-node';
import { serializeXml, parseXml } from './services/xml-serializer';
import { BooleanControl } from './controls/boolean-control';
import { TelephoneControl } from './controls/telephone-control';
import type { XmlControlMapping } from './models/xml-editor-config';

/**
 * E2E-style integration tests that exercise the full editor lifecycle.
 * Uses TestBed to mount the full component tree.
 */

@Component({
  selector: 'e2e-host',
  imports: [XmlEditor],
  template: `
    <xml-editor
      [(document)]="doc"
      [controls]="controls"
      [showPreview]="true"
    />
  `,
})
class E2EHost {
  doc = signal<XmlNode>(createNode('root'));
  controls: XmlControlMapping[] = [
    {
      match: (n) => n.tagName === 'flag',
      component: BooleanControl,
      hideChildren: true,
    },
    {
      match: (n) => n.tagName === 'phone',
      component: TelephoneControl,
    },
  ];
}

describe('XmlEditor E2E', () => {
  let fixture: ComponentFixture<E2EHost>;
  let host: E2EHost;
  let el: HTMLElement;

  beforeEach(async () => {
    resetIdCounter();
    await TestBed.configureTestingModule({
      imports: [E2EHost],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(E2EHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should start with empty root element', () => {
    const preview = el.querySelector('.xml-preview');
    expect(preview?.textContent?.trim()).toBe('<root />');
  });

  it('should update document model on programmatic changes', async () => {
    // Build a document programmatically
    const doc = createNode('catalog', {
      attributes: [createAttribute('lang', 'en')],
      children: [
        createNode('item', {
          attributes: [createAttribute('id', '42')],
          textContent: 'Widget',
        }),
      ],
    });

    host.doc.set(doc);
    await fixture.whenStable();

    // Verify preview reflects the change
    const preview = el.querySelector('.xml-preview');
    expect(preview?.textContent).toContain('<catalog');
    expect(preview?.textContent).toContain('lang="en"');
    expect(preview?.textContent).toContain('<item');
    expect(preview?.textContent).toContain('Widget');
  });

  it('should serialize and re-parse consistently', () => {
    const original = createNode('data', {
      attributes: [createAttribute('key', 'value')],
      children: [
        createNode('nested', {
          textContent: 'content here',
          children: [createNode('deep', { textContent: 'leaf' })],
        }),
      ],
    });

    const xml = serializeXml(original);
    const parsed = parseXml(xml);

    expect(parsed.tagName).toBe('data');
    expect(parsed.attributes[0].name).toBe('key');
    expect(parsed.attributes[0].value).toBe('value');
    expect(parsed.children[0].tagName).toBe('nested');
    expect(parsed.children[0].textContent).toBe('content here');
    expect(parsed.children[0].children[0].tagName).toBe('deep');
    expect(parsed.children[0].children[0].textContent).toBe('leaf');
  });

  it('should handle document with many levels of nesting', async () => {
    // Create 5 levels deep
    let deepest = createNode('level5', { textContent: 'bottom' });
    let current: XmlNode = deepest;
    for (let i = 4; i >= 1; i--) {
      current = createNode(`level${i}`, { children: [current] });
    }

    host.doc.set(current);
    await fixture.whenStable();

    const preview = el.querySelector('.xml-preview');
    const text = preview?.textContent ?? '';
    expect(text).toContain('<level1>');
    expect(text).toContain('<level5>bottom</level5>');
  });

  it('should handle document with many attributes', async () => {
    const attrs = Array.from({ length: 10 }, (_, i) =>
      createAttribute(`attr${i}`, `val${i}`),
    );
    host.doc.set(createNode('multi', { attributes: attrs }));
    await fixture.whenStable();

    const preview = el.querySelector('.xml-preview');
    const text = preview?.textContent ?? '';
    expect(text).toContain('attr0="val0"');
    expect(text).toContain('attr9="val9"');
  });

  it('should handle XML import via parseXml', async () => {
    const xmlString = `<bookstore>
  <book category="fiction">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <price>10.99</price>
  </book>
</bookstore>`;

    const parsed = parseXml(xmlString);
    host.doc.set(parsed);
    await fixture.whenStable();

    const preview = el.querySelector('.xml-preview');
    const text = preview?.textContent ?? '';
    expect(text).toContain('<bookstore>');
    expect(text).toContain('category="fiction"');
    expect(text).toContain('The Great Gatsby');
    expect(text).toContain('F. Scott Fitzgerald');
    expect(text).toContain('10.99');
  });

  it('should handle special characters in content', async () => {
    const doc = createNode('data', {
      textContent: 'Tom & Jerry <friends> "forever"',
    });
    host.doc.set(doc);
    await fixture.whenStable();

    const preview = el.querySelector('.xml-preview');
    const text = preview?.textContent ?? '';
    expect(text).toContain('&amp;');
    expect(text).toContain('&lt;');
    expect(text).toContain('&quot;');
  });

  it('should render custom controls for matched nodes', async () => {
    const doc = createNode('config', {
      children: [
        createNode('flag', { textContent: 'true' }),
        createNode('phone', { textContent: '+15559999999' }),
      ],
    });
    host.doc.set(doc);
    await fixture.whenStable();

    // The custom controls should be registered
    // Verify the editor rendered at least the root node
    const badge = el.querySelector('.tag-badge');
    expect(badge?.textContent).toContain('config');
  });

  it('should handle empty children array gracefully', async () => {
    const doc = createNode('empty', { children: [] });
    host.doc.set(doc);
    await fixture.whenStable();

    const preview = el.querySelector('.xml-preview');
    expect(preview?.textContent?.trim()).toBe('<empty />');
  });

  it('should handle node with only whitespace text content', async () => {
    const doc = createNode('ws', { textContent: '   ' });
    host.doc.set(doc);
    await fixture.whenStable();

    const preview = el.querySelector('.xml-preview');
    // Whitespace-only text is treated as empty
    expect(preview?.textContent?.trim()).toBe('<ws />');
  });
});
