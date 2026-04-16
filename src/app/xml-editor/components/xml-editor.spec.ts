import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { XmlEditor } from './xml-editor';
import {
  createNode,
  createAttribute,
  resetIdCounter,
  type XmlNode,
} from '../models/xml-node';
import { TelephoneControl } from '../controls/telephone-control';
import { BooleanControl } from '../controls/boolean-control';
import { UrlControl } from '../controls/url-control';
import type { XmlControlMapping } from '../models/xml-editor-config';

@Component({
  selector: 'test-host',
  imports: [XmlEditor],
  template: `
    <xml-editor
      [(document)]="doc"
      [controls]="controls"
      [readOnly]="readOnly()"
      [showPreview]="true"
    />
  `,
})
class TestHost {
  doc = signal(
    createNode('contacts', {
      attributes: [createAttribute('version', '1.0')],
      children: [
        createNode('person', {
          attributes: [createAttribute('id', '1')],
          children: [
            createNode('name', { textContent: 'Alice' }),
            createNode('phone', { textContent: '+15551234567' }),
            createNode('active', { textContent: 'true' }),
          ],
        }),
        createNode('person', {
          attributes: [createAttribute('id', '2')],
          children: [
            createNode('name', { textContent: 'Bob' }),
          ],
        }),
      ],
    }),
  );
  readOnly = signal(false);
  controls: XmlControlMapping[] = [
    {
      match: (n) => n.tagName === 'phone',
      component: TelephoneControl,
    },
    {
      match: (n) => n.tagName === 'active',
      component: BooleanControl,
      hideChildren: true,
    },
    {
      match: (n) => n.tagName === 'website',
      component: UrlControl,
    },
  ];
}

describe('XmlEditor Integration', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    resetIdCounter();
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should render toolbar', () => {
    const toolbar = el.querySelector('.editor-toolbar');
    expect(toolbar).toBeTruthy();
    expect(toolbar?.textContent).toContain('XML Editor');
  });

  it('should show breadcrumb with root', () => {
    const crumb = el.querySelector('.crumb-current');
    expect(crumb?.textContent).toContain('contacts');
  });

  it('should show XML preview', () => {
    const preview = el.querySelector('.xml-preview');
    expect(preview).toBeTruthy();
    expect(preview?.textContent).toContain('<contacts');
  });

  it('should render children as rows', () => {
    const rows = el.querySelectorAll('.child-row');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('person');
  });

  it('should navigate into child on click', async () => {
    const row = el.querySelector('.child-row') as HTMLElement;
    row.click();
    await fixture.whenStable();

    // Breadcrumb should now show contacts > person
    const crumbs = el.querySelectorAll('.crumb-btn, .crumb-current');
    expect(crumbs.length).toBe(2);
    expect(crumbs[0].textContent).toContain('contacts');
    expect(crumbs[1].textContent).toContain('person');
  });

  it('should navigate back via breadcrumb', async () => {
    // Navigate into first child
    const row = el.querySelector('.child-row') as HTMLElement;
    row.click();
    await fixture.whenStable();

    // Click root breadcrumb
    const rootCrumb = el.querySelector('.crumb-btn') as HTMLElement;
    rootCrumb.click();
    await fixture.whenStable();

    // Should be back at root with 2 children
    const rows = el.querySelectorAll('.child-row');
    expect(rows.length).toBe(2);
  });

  it('should show node editor for current node', () => {
    const nodeEditor = el.querySelector('xml-node-editor');
    expect(nodeEditor).toBeTruthy();
  });

  it('should update document when node changes', async () => {
    host.doc.update((d) => ({ ...d, tagName: 'addressbook' }));
    await fixture.whenStable();

    const crumb = el.querySelector('.crumb-current');
    expect(crumb?.textContent).toContain('addressbook');
  });

  it('should apply read-only mode', async () => {
    host.readOnly.set(true);
    await fixture.whenStable();

    const addBtn = el.querySelector('.add-child-btn');
    expect(addBtn).toBeNull();
  });

  it('should show import panel on toggle', async () => {
    const importBtn = el.querySelector(
      'button[mattooltip="Import XML"]',
    ) as HTMLButtonElement;
    importBtn?.click();
    await fixture.whenStable();

    expect(el.querySelector('.import-panel')).toBeTruthy();
  });

  it('should render custom control when navigated to matching node', async () => {
    // Navigate: contacts → person (first) → active
    const personRow = el.querySelector('.child-row') as HTMLElement;
    personRow.click();
    await fixture.whenStable();

    // Now at person level, find active child
    const rows = el.querySelectorAll('.child-row');
    const activeRow = Array.from(rows).find((r) =>
      r.textContent?.includes('active'),
    ) as HTMLElement;
    activeRow?.click();
    await fixture.whenStable();

    // Should render boolean control
    const toggle = el.querySelector('mat-slide-toggle');
    expect(toggle).toBeTruthy();
  });
});
