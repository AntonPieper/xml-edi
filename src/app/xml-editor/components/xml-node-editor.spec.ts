import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { describe, it, expect, beforeEach } from 'vitest';
import { XmlNodeEditor } from './xml-node-editor';
import {
  createNode,
  createAttribute,
  resetIdCounter,
  type XmlNode,
} from '../models/xml-node';
import type { XmlSchemaDefinition } from '../models/xml-schema';

const testSchema: XmlSchemaDefinition = {
  tags: [
    {
      name: 'person',
      title: 'Person',
      description: 'Contact entry',
      icon: 'person',
      attributes: [
        { name: 'id', title: 'ID', description: 'Unique identifier' },
        { name: 'role', title: 'Role' },
      ],
      allowedChildren: ['name', 'phone'],
    },
    {
      name: 'name',
      title: 'Full Name',
      description: "Person's name",
      icon: 'badge',
    },
    {
      name: 'phone',
      title: 'Phone Number',
      description: 'Telephone',
      icon: 'phone',
    },
  ],
};

describe('XmlNodeEditor', () => {
  let fixture: ComponentFixture<XmlNodeEditor>;
  let component: XmlNodeEditor;
  let el: HTMLElement;

  beforeEach(async () => {
    resetIdCounter();
    await TestBed.configureTestingModule({
      imports: [XmlNodeEditor],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(XmlNodeEditor);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  it('should render section labels', async () => {
    fixture.componentRef.setInput('node', createNode('test'));
    await fixture.whenStable();

    const labels = el.querySelectorAll('.section-label span');
    const texts = Array.from(labels).map((l) => l.textContent?.trim());
    expect(texts).toContain('Tag Name');
    expect(texts).toContain('Attributes');
    expect(texts).toContain('Text Content');
  });

  it('should emit nodeChange when tag name updated', () => {
    fixture.componentRef.setInput('node', createNode('original'));
    let emitted = null as XmlNode | null;
    component.nodeChange.subscribe((v) => (emitted = v));

    component.updateTagName('renamed');

    expect(emitted!.tagName).toBe('renamed');
  });

  it('should emit nodeChange when text content updated', () => {
    fixture.componentRef.setInput('node', createNode('el'));
    let emitted = null as XmlNode | null;
    component.nodeChange.subscribe((v) => (emitted = v));

    component.updateTextContent({
      target: { value: 'hello' },
    } as unknown as Event);

    expect(emitted!.textContent).toBe('hello');
  });

  it('should emit nodeChange with new attribute on addAttribute', () => {
    fixture.componentRef.setInput('node', createNode('el'));
    let emitted = null as XmlNode | null;
    component.nodeChange.subscribe((v) => (emitted = v));

    component.addAttribute();

    expect(emitted!.attributes).toHaveLength(1);
    expect(emitted!.attributes[0].name).toBe('');
  });

  it('should emit nodeChange with updated attribute', () => {
    const attr = createAttribute('key', 'val');
    fixture.componentRef.setInput(
      'node',
      createNode('el', { attributes: [attr] }),
    );
    let emitted = null as XmlNode | null;
    component.nodeChange.subscribe((v) => (emitted = v));

    component.updateAttribute(attr.id, {
      name: 'newKey',
      value: 'newVal',
    });

    expect(emitted!.attributes[0].name).toBe('newKey');
    expect(emitted!.attributes[0].value).toBe('newVal');
  });

  it('should emit nodeChange without removed attribute', () => {
    const a1 = createAttribute('a', '1');
    const a2 = createAttribute('b', '2');
    fixture.componentRef.setInput(
      'node',
      createNode('el', { attributes: [a1, a2] }),
    );
    let emitted = null as XmlNode | null;
    component.nodeChange.subscribe((v) => (emitted = v));

    component.removeAttribute(a1.id);

    expect(emitted!.attributes).toHaveLength(1);
    expect(emitted!.attributes[0].name).toBe('b');
  });

  it('should hide add-attribute button when readOnly', async () => {
    fixture.componentRef.setInput('node', createNode('el'));
    fixture.componentRef.setInput('readOnly', true);
    await fixture.whenStable();

    const btn = el.querySelector('.section-action-btn');
    expect(btn).toBeNull();
  });

  // ── Schema integration ──

  it('should show tag title hint from schema', async () => {
    fixture.componentRef.setInput('node', createNode('person'));
    fixture.componentRef.setInput('schema', testSchema);
    await fixture.whenStable();

    const hint = el.querySelector('.tag-title-hint');
    expect(hint?.textContent).toContain('Person');
  });

  it('should show tag description from schema', async () => {
    fixture.componentRef.setInput('node', createNode('person'));
    fixture.componentRef.setInput('schema', testSchema);
    await fixture.whenStable();

    const desc = el.querySelector('.tag-description');
    expect(desc?.textContent).toContain('Contact entry');
  });

  it('should show schema icon for tag', async () => {
    fixture.componentRef.setInput('node', createNode('person'));
    fixture.componentRef.setInput('schema', testSchema);
    await fixture.whenStable();

    const icons = el.querySelectorAll('.section-label mat-icon');
    expect(icons[0]?.textContent?.trim()).toBe('person');
  });

  it('should filter tag defs by search query', () => {
    fixture.componentRef.setInput('node', createNode(''));
    fixture.componentRef.setInput('schema', testSchema);

    // All tags visible
    expect(component.filteredTagDefs().length).toBe(3);

    // Filter by name
    component.tagFilter.set('phone');
    expect(component.filteredTagDefs().length).toBe(1);
    expect(component.filteredTagDefs()[0].name).toBe('phone');
  });

  it('should restrict tags by allowedTagNames', () => {
    fixture.componentRef.setInput('node', createNode(''));
    fixture.componentRef.setInput('schema', testSchema);
    fixture.componentRef.setInput('allowedTagNames', [
      'name',
      'phone',
    ]);

    expect(component.availableTagDefs().length).toBe(2);
    expect(
      component.availableTagDefs().map((t) => t.name),
    ).toEqual(['name', 'phone']);
  });

  it('should provide attribute defs for current tag', () => {
    fixture.componentRef.setInput('node', createNode('person'));
    fixture.componentRef.setInput('schema', testSchema);

    expect(component.attrDefs().length).toBe(2);
    expect(component.attrDefs()[0].name).toBe('id');
  });

  it('should return empty attrDefs for unknown tag', () => {
    fixture.componentRef.setInput('node', createNode('unknown'));
    fixture.componentRef.setInput('schema', testSchema);

    expect(component.attrDefs().length).toBe(0);
  });

  it('should work without schema (no hint, no autocomplete)', async () => {
    fixture.componentRef.setInput('node', createNode('test'));
    await fixture.whenStable();

    expect(el.querySelector('.tag-title-hint')).toBeNull();
    expect(el.querySelector('.tag-description')).toBeNull();
    expect(component.filteredTagDefs().length).toBe(0);
  });
});
