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
import { BooleanControl } from '../controls/boolean-control';
import type { XmlControlMapping } from '../models/xml-editor-config';

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

  it('should render tag name in header badge', async () => {
    fixture.componentRef.setInput(
      'node',
      createNode('testElement'),
    );
    await fixture.whenStable();

    const badge = el.querySelector('.tag-badge');
    expect(badge?.textContent).toContain('testElement');
  });

  it('should display attribute count chip', async () => {
    fixture.componentRef.setInput(
      'node',
      createNode('el', {
        attributes: [
          createAttribute('a', '1'),
          createAttribute('b', '2'),
        ],
      }),
    );
    await fixture.whenStable();

    const chip = el.querySelector('.attr-chip');
    expect(chip?.textContent?.trim()).toContain('2');
  });

  it('should display children count chip', async () => {
    fixture.componentRef.setInput(
      'node',
      createNode('parent', {
        children: [createNode('c1'), createNode('c2'), createNode('c3')],
      }),
    );
    await fixture.whenStable();

    const chip = el.querySelector('.child-chip');
    expect(chip?.textContent?.trim()).toContain('3');
  });

  it('should display text content chip when text exists', async () => {
    fixture.componentRef.setInput(
      'node',
      createNode('el', { textContent: 'some text' }),
    );
    await fixture.whenStable();

    const chip = el.querySelector('.text-chip');
    expect(chip).toBeTruthy();
  });

  it('should emit nodeChange when updateTagName is called', () => {
    const node = createNode('original');
    fixture.componentRef.setInput('node', node);
    let emitted = null as XmlNode | null;
    component.nodeChange.subscribe((v) => (emitted = v));

    component.updateTagName({
      target: { value: 'renamed' },
    } as unknown as Event);

    expect(emitted!.tagName).toBe('renamed');
  });

  it('should emit nodeChange when updateTextContent is called', () => {
    const node = createNode('el');
    fixture.componentRef.setInput('node', node);
    let emitted = null as XmlNode | null;
    component.nodeChange.subscribe((v) => (emitted = v));

    component.updateTextContent({
      target: { value: 'new text' },
    } as unknown as Event);

    expect(emitted!.textContent).toBe('new text');
  });

  it('should emit nodeChange with new attribute when addAttribute called', () => {
    const node = createNode('el');
    fixture.componentRef.setInput('node', node);
    let emitted = null as XmlNode | null;
    component.nodeChange.subscribe((v) => (emitted = v));

    component.addAttribute();

    expect(emitted!.attributes).toHaveLength(1);
    expect(emitted!.attributes[0].name).toBe('');
    expect(emitted!.attributes[0].value).toBe('');
  });

  it('should emit nodeChange with updated attribute', () => {
    const attr = createAttribute('key', 'val');
    const node = createNode('el', { attributes: [attr] });
    fixture.componentRef.setInput('node', node);
    let emitted = null as XmlNode | null;
    component.nodeChange.subscribe((v) => (emitted = v));

    component.updateAttribute(attr.id, {
      name: 'newKey',
      value: 'newVal',
    });

    expect(emitted!.attributes[0].name).toBe('newKey');
    expect(emitted!.attributes[0].value).toBe('newVal');
  });

  it('should emit nodeChange without the removed attribute', () => {
    const a1 = createAttribute('a', '1');
    const a2 = createAttribute('b', '2');
    const node = createNode('el', { attributes: [a1, a2] });
    fixture.componentRef.setInput('node', node);
    let emitted = null as XmlNode | null;
    component.nodeChange.subscribe((v) => (emitted = v));

    component.removeAttribute(a1.id);

    expect(emitted!.attributes).toHaveLength(1);
    expect(emitted!.attributes[0].name).toBe('b');
  });

  it('should emit nodeChange with new child when addChild called', () => {
    const node = createNode('parent');
    fixture.componentRef.setInput('node', node);
    let emitted = null as XmlNode | null;
    component.nodeChange.subscribe((v) => (emitted = v));

    component.addChild();

    expect(emitted!.children).toHaveLength(1);
    expect(emitted!.children[0].tagName).toBe('element');
  });

  it('should emit updated children on onChildChange', () => {
    const child = createNode('child');
    const node = createNode('parent', { children: [child] });
    fixture.componentRef.setInput('node', node);
    let emitted = null as XmlNode | null;
    component.nodeChange.subscribe((v) => (emitted = v));

    const updatedChild = { ...child, tagName: 'updated-child' };
    component.onChildChange(0, updatedChild);

    expect(emitted!.children[0].tagName).toBe('updated-child');
  });

  it('should emit without removed child on onChildRemove', () => {
    const c1 = createNode('c1');
    const c2 = createNode('c2');
    const node = createNode('parent', { children: [c1, c2] });
    fixture.componentRef.setInput('node', node);
    let emitted = null as XmlNode | null;
    component.nodeChange.subscribe((v) => (emitted = v));

    component.onChildRemove(0);

    expect(emitted!.children).toHaveLength(1);
    expect(emitted!.children[0].tagName).toBe('c2');
  });

  it('should not show remove button when removable is false', async () => {
    fixture.componentRef.setInput('node', createNode('root'));
    fixture.componentRef.setInput('removable', false);
    await fixture.whenStable();

    const removeSection = el.querySelector('.remove-section');
    expect(removeSection).toBeNull();
  });

  it('should not show remove button in readOnly mode', async () => {
    fixture.componentRef.setInput('node', createNode('el'));
    fixture.componentRef.setInput('readOnly', true);
    await fixture.whenStable();

    const removeSection = el.querySelector('.remove-section');
    expect(removeSection).toBeNull();
  });

  it('should render custom control when matched', async () => {
    const node = createNode('active', { textContent: 'true' });
    const controls: XmlControlMapping[] = [
      {
        match: (n) => n.tagName === 'active',
        component: BooleanControl,
        hideChildren: true,
      },
    ];
    fixture.componentRef.setInput('node', node);
    fixture.componentRef.setInput('controls', controls);
    await fixture.whenStable();

    const toggle = el.querySelector('mat-slide-toggle');
    expect(toggle).toBeTruthy();
  });

  it('should use depth color based on depth input', () => {
    fixture.componentRef.setInput('node', createNode('el'));
    fixture.componentRef.setInput('depth', 0);
    expect(component.depthColor()).toBe('#00bcd4');

    fixture.componentRef.setInput('depth', 3);
    expect(component.depthColor()).toBe('#ffa726');
  });
});
