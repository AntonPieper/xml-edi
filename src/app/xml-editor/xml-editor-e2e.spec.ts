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

  it('should update preview on document change', async () => {
    host.doc.set(
      createNode('catalog', {
        attributes: [createAttribute('lang', 'en')],
        children: [
          createNode('item', {
            attributes: [createAttribute('id', '42')],
            textContent: 'Widget',
          }),
        ],
      }),
    );
    await fixture.whenStable();

    const preview = el.querySelector('.xml-preview');
    expect(preview?.textContent).toContain('<catalog');
    expect(preview?.textContent).toContain('lang="en"');
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
    expect(parsed.children[0].tagName).toBe('nested');
    expect(parsed.children[0].textContent).toBe('content here');
    expect(parsed.children[0].children[0].textContent).toBe('leaf');
  });

  it('should handle deep document via navigation (no nesting)', async () => {
    let deepest = createNode('level5', { textContent: 'bottom' });
    let current: XmlNode = deepest;
    for (let i = 4; i >= 1; i--) {
      current = createNode(`level${i}`, { children: [current] });
    }

    host.doc.set(current);
    await fixture.whenStable();

    // Navigate 4 levels deep by clicking child rows
    for (let i = 0; i < 4; i++) {
      const row = el.querySelector('.child-row') as HTMLElement;
      expect(row).toBeTruthy();
      row.click();
      await fixture.whenStable();
    }

    // Breadcrumb should show full path
    const crumbs = el.querySelectorAll('.crumb-btn, .crumb-current');
    expect(crumbs.length).toBe(5);
    expect(crumbs[4].textContent).toContain('level5');
  });

  it('should handle many attributes', async () => {
    const attrs = Array.from({ length: 10 }, (_, i) =>
      createAttribute(`attr${i}`, `val${i}`),
    );
    host.doc.set(createNode('multi', { attributes: attrs }));
    await fixture.whenStable();

    const preview = el.querySelector('.xml-preview');
    expect(preview?.textContent).toContain('attr0="val0"');
    expect(preview?.textContent).toContain('attr9="val9"');
  });

  it('should handle XML import via parseXml', async () => {
    const xmlString = `<bookstore>
  <book category="fiction">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
  </book>
</bookstore>`;

    const parsed = parseXml(xmlString);
    host.doc.set(parsed);
    await fixture.whenStable();

    const preview = el.querySelector('.xml-preview');
    expect(preview?.textContent).toContain('<bookstore>');
    expect(preview?.textContent).toContain('category="fiction"');
    expect(preview?.textContent).toContain('The Great Gatsby');
  });

  it('should handle special characters in content', async () => {
    host.doc.set(
      createNode('data', {
        textContent: 'Tom & Jerry <friends> "forever"',
      }),
    );
    await fixture.whenStable();

    const preview = el.querySelector('.xml-preview');
    expect(preview?.textContent).toContain('&amp;');
    expect(preview?.textContent).toContain('&lt;');
  });

  it('should show child rows for nested documents', async () => {
    host.doc.set(
      createNode('config', {
        children: [
          createNode('flag', { textContent: 'true' }),
          createNode('phone', { textContent: '+15559999999' }),
          createNode('other'),
        ],
      }),
    );
    await fixture.whenStable();

    const rows = el.querySelectorAll('.child-row');
    expect(rows.length).toBe(3);
  });

  it('should handle empty children array', async () => {
    host.doc.set(createNode('empty', { children: [] }));
    await fixture.whenStable();

    const preview = el.querySelector('.xml-preview');
    expect(preview?.textContent?.trim()).toBe('<empty />');
  });

  it('should handle whitespace-only text content', async () => {
    host.doc.set(createNode('ws', { textContent: '   ' }));
    await fixture.whenStable();

    const preview = el.querySelector('.xml-preview');
    expect(preview?.textContent?.trim()).toBe('<ws />');
  });
});
