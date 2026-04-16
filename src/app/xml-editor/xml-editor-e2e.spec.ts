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

  it('round-trip: serialize → parse preserves structure', () => {
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
    expect(parsed.children[0].children[0].textContent).toBe('leaf');
  });

  it('should navigate deep and show full breadcrumb', async () => {
    let current: XmlNode = createNode('level5', {
      textContent: 'bottom',
    });
    for (let i = 4; i >= 1; i--) {
      current = createNode(`level${i}`, { children: [current] });
    }
    host.doc.set(current);
    await fixture.whenStable();

    // Navigate level1 → level2 → level3 (3 branch clicks)
    for (let i = 0; i < 3; i++) {
      const branch = el.querySelector('.branch-child') as HTMLElement;
      expect(branch).toBeTruthy();
      branch.click();
      await fixture.whenStable();
    }

    const crumbCurrent = el.querySelector('.crumb-current');
    expect(crumbCurrent?.textContent).toContain('level4');

    const backBtn = el.querySelector('.back-btn');
    expect(backBtn?.textContent).toContain('level3');
  });

  it('should show leaf children inline with custom controls', async () => {
    host.doc.set(
      createNode('config', {
        children: [
          createNode('flag', { textContent: 'true' }),
          createNode('phone', { textContent: '+15559999999' }),
          createNode('other', { textContent: 'plain' }),
        ],
      }),
    );
    await fixture.whenStable();

    const leaves = el.querySelectorAll('.leaf-child');
    expect(leaves.length).toBe(3);
  });

  it('should separate leaf and branch children', async () => {
    host.doc.set(
      createNode('mixed', {
        children: [
          createNode('title', { textContent: 'Hi' }),
          createNode('group', {
            children: [createNode('item')],
          }),
          createNode('note', { textContent: 'x' }),
        ],
      }),
    );
    await fixture.whenStable();

    expect(el.querySelectorAll('.leaf-child').length).toBe(2);
    expect(el.querySelectorAll('.branch-child').length).toBe(1);
  });

  it('should handle special characters in preview', async () => {
    host.doc.set(
      createNode('data', {
        textContent: 'Tom & Jerry <friends>',
      }),
    );
    await fixture.whenStable();

    const preview = el.querySelector('.xml-preview');
    expect(preview?.textContent).toContain('&amp;');
    expect(preview?.textContent).toContain('&lt;');
  });

  it('should render code editor section', () => {
    expect(el.querySelector('.code-editor-section')).toBeTruthy();
  });

  it('should handle empty document', async () => {
    host.doc.set(createNode('empty'));
    await fixture.whenStable();

    expect(el.querySelector('.xml-preview')?.textContent?.trim()).toBe(
      '<empty />',
    );
    expect(el.querySelector('.empty-hint')).toBeTruthy();
  });
});
