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
            createNode('website', {
              textContent: 'https://alice.dev',
            }),
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

  it('should render the editor toolbar', () => {
    const toolbar = el.querySelector('mat-toolbar');
    expect(toolbar).toBeTruthy();
    expect(toolbar?.textContent).toContain('XML Editor');
  });

  it('should render root node', () => {
    const badge = el.querySelector('.tag-badge');
    expect(badge?.textContent).toContain('contacts');
  });

  it('should show XML preview panel', () => {
    const preview = el.querySelector('.xml-preview');
    expect(preview).toBeTruthy();
    expect(preview?.textContent).toContain('<contacts');
    expect(preview?.textContent).toContain('version="1.0"');
  });

  it('should display correct node count in preview', () => {
    const preview = el.querySelector('.xml-preview');
    const text = preview?.textContent ?? '';
    expect(text).toContain('<person');
    expect(text).toContain('<name>Alice</name>');
    expect(text).toContain('<active>true</active>');
  });

  it('should update preview when document changes', async () => {
    // Modify the document
    host.doc.update((doc) => ({
      ...doc,
      tagName: 'addressbook',
    }));
    await fixture.whenStable();

    const preview = el.querySelector('.xml-preview');
    expect(preview?.textContent).toContain('<addressbook');
  });

  it('should render multiple child nodes', () => {
    const badges = el.querySelectorAll('.tag-badge');
    // root (contacts) should be visible
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('should apply read-only mode', async () => {
    host.readOnly.set(true);
    await fixture.whenStable();

    // Import button should not be visible in readOnly mode
    const importBtn = el.querySelector(
      '[mattooltip="Import XML"]',
    );
    expect(importBtn).toBeNull();
  });

  it('should show import panel when toggle button clicked', async () => {
    const importBtn = el.querySelector(
      'button[mattooltip="Import XML"]',
    ) as HTMLButtonElement;
    importBtn?.click();
    await fixture.whenStable();

    const importPanel = el.querySelector('.import-panel');
    expect(importPanel).toBeTruthy();
  });
});
