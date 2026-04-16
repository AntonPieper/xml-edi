import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { describe, it, expect, beforeEach } from 'vitest';
import { XmlChildEditor } from './xml-child-editor';
import {
  createNode,
  createAttribute,
  resetIdCounter,
  type XmlNode,
} from '../models/xml-node';
import { BooleanControl } from '../controls/boolean-control';
import { TelephoneControl } from '../controls/telephone-control';
import type { XmlControlMapping } from '../models/xml-editor-config';

describe('XmlChildEditor', () => {
  let fixture: ComponentFixture<XmlChildEditor>;
  let component: XmlChildEditor;
  let el: HTMLElement;

  const phoneControl: XmlControlMapping = {
    match: (n) => n.tagName === 'phone',
    component: TelephoneControl,
  };
  const boolControl: XmlControlMapping = {
    match: (n) => n.tagName === 'active',
    component: BooleanControl,
    hideChildren: true,
  };

  beforeEach(async () => {
    resetIdCounter();
    await TestBed.configureTestingModule({
      imports: [XmlChildEditor],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(XmlChildEditor);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  // ── Leaf rendering ──

  it('should render leaf node inline', async () => {
    fixture.componentRef.setInput(
      'child',
      createNode('name', { textContent: 'Alice' }),
    );
    await fixture.whenStable();

    expect(el.querySelector('.leaf-child')).toBeTruthy();
    expect(el.querySelector('.branch-child')).toBeNull();
    expect(el.querySelector('.leaf-tag')?.textContent).toContain(
      'name',
    );
  });

  it('should render text input for leaf without custom control', async () => {
    fixture.componentRef.setInput(
      'child',
      createNode('name', { textContent: 'Alice' }),
    );
    await fixture.whenStable();

    const input = el.querySelector('input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('Alice');
  });

  it('should render custom control for matching leaf', async () => {
    fixture.componentRef.setInput(
      'child',
      createNode('phone', { textContent: '+15551234567' }),
    );
    fixture.componentRef.setInput('controls', [phoneControl]);
    await fixture.whenStable();

    const phoneIcon = el.querySelector('mat-icon');
    // Custom control should render (TelephoneControl has phone icon)
    expect(el.querySelector('.leaf-child')).toBeTruthy();
  });

  it('should show attr badge when leaf has attributes', async () => {
    fixture.componentRef.setInput(
      'child',
      createNode('el', {
        attributes: [createAttribute('a', '1')],
      }),
    );
    await fixture.whenStable();

    const badge = el.querySelector('.attr-badge');
    expect(badge?.textContent).toContain('1');
  });

  it('should emit childChange on text input', () => {
    const child = createNode('name', { textContent: 'old' });
    fixture.componentRef.setInput('child', child);
    let emitted = null as XmlNode | null;
    component.childChange.subscribe((v) => (emitted = v));

    component.updateContent({
      target: { value: 'new' },
    } as unknown as Event);

    expect(emitted!.textContent).toBe('new');
    expect(emitted!.tagName).toBe('name');
  });

  // ── Branch rendering ──

  it('should render branch node as navigable card', async () => {
    fixture.componentRef.setInput(
      'child',
      createNode('person', {
        children: [createNode('name')],
      }),
    );
    await fixture.whenStable();

    expect(el.querySelector('.branch-child')).toBeTruthy();
    expect(el.querySelector('.leaf-child')).toBeNull();
    expect(
      el.querySelector('.branch-tag')?.textContent,
    ).toContain('person');
  });

  it('should show children count for branch', async () => {
    fixture.componentRef.setInput(
      'child',
      createNode('person', {
        children: [createNode('a'), createNode('b')],
      }),
    );
    await fixture.whenStable();

    const pill = el.querySelector('.meta-pill');
    expect(pill?.textContent).toContain('2 children');
  });

  it('should show chevron for branch', async () => {
    fixture.componentRef.setInput(
      'child',
      createNode('person', { children: [createNode('a')] }),
    );
    await fixture.whenStable();

    const chevron = el.querySelector('.branch-chevron');
    expect(chevron).toBeTruthy();
  });

  // ── hideChildren makes branch act as inline ──

  it('should render inline when control has hideChildren', async () => {
    fixture.componentRef.setInput(
      'child',
      createNode('active', {
        textContent: 'true',
        children: [createNode('ignored')],
      }),
    );
    fixture.componentRef.setInput('controls', [boolControl]);
    await fixture.whenStable();

    // Despite having children, hideChildren → inline
    expect(el.querySelector('.leaf-child')).toBeTruthy();
    expect(el.querySelector('.branch-child')).toBeNull();
  });

  // ── Events ──

  it('should emit navigate on detail button click', async () => {
    fixture.componentRef.setInput(
      'child',
      createNode('el', { textContent: 'x' }),
    );
    await fixture.whenStable();

    let navigated = false;
    component.navigate.subscribe(() => (navigated = true));

    const btn = el.querySelector('.detail-btn') as HTMLElement;
    btn?.click();

    expect(navigated).toBe(true);
  });

  it('should emit navigate on branch card click', async () => {
    fixture.componentRef.setInput(
      'child',
      createNode('group', { children: [createNode('a')] }),
    );
    await fixture.whenStable();

    let navigated = false;
    component.navigate.subscribe(() => (navigated = true));

    const card = el.querySelector('.branch-child') as HTMLElement;
    card?.click();

    expect(navigated).toBe(true);
  });

  it('should emit remove on remove button click (leaf)', async () => {
    fixture.componentRef.setInput(
      'child',
      createNode('el', { textContent: 'x' }),
    );
    fixture.componentRef.setInput('readOnly', false);
    await fixture.whenStable();

    let removed = false;
    component.remove.subscribe(() => (removed = true));

    const btn = el.querySelector('.remove-btn') as HTMLElement;
    btn?.click();

    expect(removed).toBe(true);
  });

  it('should hide remove button in readOnly', async () => {
    fixture.componentRef.setInput(
      'child',
      createNode('el', { textContent: 'x' }),
    );
    fixture.componentRef.setInput('readOnly', true);
    await fixture.whenStable();

    expect(el.querySelector('.remove-btn')).toBeNull();
  });

  it('should compute isInline correctly', () => {
    // Leaf = inline
    fixture.componentRef.setInput(
      'child',
      createNode('leaf', { textContent: 'x' }),
    );
    expect(component.isInline()).toBe(true);

    // Branch = not inline
    fixture.componentRef.setInput(
      'child',
      createNode('branch', { children: [createNode('a')] }),
    );
    expect(component.isInline()).toBe(false);

    // Branch with hideChildren control = inline
    fixture.componentRef.setInput(
      'child',
      createNode('active', {
        textContent: 'true',
        children: [createNode('a')],
      }),
    );
    fixture.componentRef.setInput('controls', [boolControl]);
    expect(component.isInline()).toBe(true);
  });
});
