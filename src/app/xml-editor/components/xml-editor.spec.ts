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

  it('should show XML preview', () => {
    const preview = el.querySelector('.xml-preview');
    expect(preview?.textContent).toContain('<contacts');
    expect(preview?.textContent).toContain('version="1.0"');
  });

  it('should render children as branch cards (person has children)', () => {
    const branches = el.querySelectorAll('.branch-child');
    expect(branches.length).toBe(2);
    expect(branches[0].textContent).toContain('person');
  });

  it('should navigate into child and show back button', async () => {
    const branch = el.querySelector('.branch-child') as HTMLElement;
    branch.click();
    await fixture.whenStable();

    // Back button should appear
    const backBtn = el.querySelector('.back-btn');
    expect(backBtn).toBeTruthy();
    expect(backBtn?.textContent).toContain('contacts');

    // Current node should be person
    const crumb = el.querySelector('.crumb-current');
    expect(crumb?.textContent).toContain('person');
  });

  it('should show leaf children inline after navigation', async () => {
    // Navigate into first person
    const branch = el.querySelector('.branch-child') as HTMLElement;
    branch.click();
    await fixture.whenStable();

    // Leaf children (name, phone, active) should render inline
    const leaves = el.querySelectorAll('.leaf-child');
    expect(leaves.length).toBe(3);
  });

  it('should navigate back via back button', async () => {
    // Navigate in
    (el.querySelector('.branch-child') as HTMLElement).click();
    await fixture.whenStable();

    // Navigate back
    (el.querySelector('.back-btn') as HTMLElement).click();
    await fixture.whenStable();

    // Should be at root with 2 branch children
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
});
