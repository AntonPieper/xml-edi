import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { XmlEditor } from './xml-editor';
import {
  createNode,
  createAttribute,
  resetIdCounter,
} from '../models/xml-node';
import { TelephoneControl } from '../controls/telephone-control';
import { BooleanControl } from '../controls/boolean-control';
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
          children: [createNode('name', { textContent: 'Bob' })],
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
    expect(el.querySelector('.editor-toolbar')).toBeTruthy();
    expect(el.querySelector('.editor-toolbar')?.textContent).toContain(
      'XML Editor',
    );
  });

  it('should show current node tag in breadcrumb', () => {
    const crumb = el.querySelector('.crumb-current');
    expect(crumb?.textContent).toContain('contacts');
  });

  it('should not show back button at root', () => {
    expect(el.querySelector('.back-btn')).toBeNull();
  });

  it('should show XML preview when showPreview is true', () => {
    const preview = el.querySelector('.xml-preview');
    expect(preview?.textContent).toContain('<contacts');
    expect(preview?.textContent).toContain('version="1.0"');
  });

  it('should render code editor section', () => {
    expect(el.querySelector('.code-editor-section')).toBeTruthy();
    expect(
      el.querySelector('.code-editor-header')?.textContent,
    ).toContain('XML Source');
  });

  it('should render children as branch cards', () => {
    const branches = el.querySelectorAll('.branch-child');
    expect(branches.length).toBe(2);
    expect(branches[0].textContent).toContain('person');
  });

  it('should navigate into child and show back button', async () => {
    const branch = el.querySelector('.branch-child') as HTMLElement;
    branch.click();
    await fixture.whenStable();

    const backBtn = el.querySelector('.back-btn');
    expect(backBtn).toBeTruthy();
    expect(backBtn?.textContent).toContain('contacts');

    const crumb = el.querySelector('.crumb-current');
    expect(crumb?.textContent).toContain('person');
  });

  it('should show leaf children inline after navigation', async () => {
    const branch = el.querySelector('.branch-child') as HTMLElement;
    branch.click();
    await fixture.whenStable();

    const leaves = el.querySelectorAll('.leaf-child');
    expect(leaves.length).toBe(3);
  });

  it('should navigate back via back button', async () => {
    (el.querySelector('.branch-child') as HTMLElement).click();
    await fixture.whenStable();

    (el.querySelector('.back-btn') as HTMLElement).click();
    await fixture.whenStable();

    expect(el.querySelectorAll('.branch-child').length).toBe(2);
    expect(el.querySelector('.back-btn')).toBeNull();
  });

  it('should apply readOnly mode', async () => {
    host.readOnly.set(true);
    await fixture.whenStable();

    expect(el.querySelector('.add-child-btn')).toBeNull();
  });

  it('should show import panel', async () => {
    const btn = el.querySelector(
      'button[mattooltip="Import XML"]',
    ) as HTMLElement;
    btn?.click();
    await fixture.whenStable();

    expect(el.querySelector('.import-panel')).toBeTruthy();
  });

  it('should handle onCodeChange with valid XML', () => {
    const editor = fixture.debugElement.children[0].componentInstance as XmlEditor;
    editor.onCodeChange('<root><child>text</child></root>');

    expect(host.doc().tagName).toBe('root');
    expect(host.doc().children[0].tagName).toBe('child');
    expect(host.doc().children[0].textContent).toBe('text');
  });

  it('should ignore invalid XML from code editor', () => {
    const editor = fixture.debugElement.children[0].componentInstance as XmlEditor;
    const before = host.doc();
    editor.onCodeChange('<invalid><unclosed>');

    expect(host.doc()).toBe(before); // unchanged
  });
});
