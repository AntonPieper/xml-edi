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

    component.updateTagName({
      target: { value: 'renamed' },
    } as unknown as Event);

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
});
