import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { describe, it, expect, beforeEach } from 'vitest';
import { XmlAttributeEditor } from './xml-attribute-editor';
import { createAttribute, resetIdCounter } from '../models/xml-node';
import type { XmlAttributeDefinition } from '../models/xml-schema';

describe('XmlAttributeEditor', () => {
  let fixture: ComponentFixture<XmlAttributeEditor>;
  let component: XmlAttributeEditor;
  let el: HTMLElement;

  beforeEach(async () => {
    resetIdCounter();
    await TestBed.configureTestingModule({
      imports: [XmlAttributeEditor],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(XmlAttributeEditor);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  it('should render attribute name and value fields', async () => {
    fixture.componentRef.setInput(
      'attribute',
      createAttribute('color', 'red'),
    );
    await fixture.whenStable();

    const inputs = el.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('should show equals sign', async () => {
    fixture.componentRef.setInput(
      'attribute',
      createAttribute('a', 'b'),
    );
    await fixture.whenStable();

    const eq = el.querySelector('.equals');
    expect(eq?.textContent?.trim()).toBe('=');
  });

  it('should emit attributeChange on name change', () => {
    fixture.componentRef.setInput(
      'attribute',
      createAttribute('key', 'val'),
    );
    let emitted = null as { name: string; value: string } | null;
    component.attributeChange.subscribe((v) => (emitted = v));

    component.onNameInput('newKey');

    expect(emitted!.name).toBe('newKey');
    expect(emitted!.value).toBe('val');
  });

  it('should emit attributeChange on value change', () => {
    fixture.componentRef.setInput(
      'attribute',
      createAttribute('key', 'val'),
    );
    let emitted = null as { name: string; value: string } | null;
    component.attributeChange.subscribe((v) => (emitted = v));

    component.onValueChange('newVal');

    expect(emitted!.name).toBe('key');
    expect(emitted!.value).toBe('newVal');
  });

  it('should show remove button when not readOnly', async () => {
    fixture.componentRef.setInput(
      'attribute',
      createAttribute('a', 'b'),
    );
    fixture.componentRef.setInput('readOnly', false);
    await fixture.whenStable();

    const btn = el.querySelector('.remove-attr-btn');
    expect(btn).toBeTruthy();
  });

  it('should hide remove button when readOnly', async () => {
    fixture.componentRef.setInput(
      'attribute',
      createAttribute('a', 'b'),
    );
    fixture.componentRef.setInput('readOnly', true);
    await fixture.whenStable();

    const btn = el.querySelector('.remove-attr-btn');
    expect(btn).toBeNull();
  });

  it('should emit remove event on button click', async () => {
    fixture.componentRef.setInput(
      'attribute',
      createAttribute('a', 'b'),
    );
    fixture.componentRef.setInput('readOnly', false);
    await fixture.whenStable();

    let removed = false;
    component.remove.subscribe(() => (removed = true));

    const btn = el.querySelector(
      '.remove-attr-btn',
    ) as HTMLButtonElement;
    btn?.click();

    expect(removed).toBe(true);
  });

  // ── Schema autocomplete ──

  it('should filter attribute defs by query', () => {
    const defs: XmlAttributeDefinition[] = [
      { name: 'id', title: 'ID', description: 'Unique identifier' },
      { name: 'role', title: 'Role', description: 'Contact role' },
    ];
    fixture.componentRef.setInput(
      'attribute',
      createAttribute('', ''),
    );
    fixture.componentRef.setInput('attributeDefs', defs);

    // No filter → all
    expect(component.filteredAttrDefs().length).toBe(2);

    // Filter by name
    component.nameFilter.set('role');
    expect(component.filteredAttrDefs().length).toBe(1);
    expect(component.filteredAttrDefs()[0].name).toBe('role');
  });

  it('should emit name via onNameSelected', () => {
    fixture.componentRef.setInput(
      'attribute',
      createAttribute('', 'val'),
    );
    let emitted = null as { name: string; value: string } | null;
    component.attributeChange.subscribe((v) => (emitted = v));

    component.onNameSelected('id');

    expect(emitted!.name).toBe('id');
    expect(emitted!.value).toBe('val');
  });
});
