import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { describe, it, expect, beforeEach } from 'vitest';
import { BooleanControl } from './boolean-control';
import {
  createNode,
  resetIdCounter,
  type XmlNode,
} from '../models/xml-node';

describe('BooleanControl', () => {
  let fixture: ComponentFixture<BooleanControl>;
  let component: BooleanControl;
  let el: HTMLElement;

  beforeEach(async () => {
    resetIdCounter();
    await TestBed.configureTestingModule({
      imports: [BooleanControl],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(BooleanControl);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  it('should show check icon for true value', async () => {
    fixture.componentRef.setInput(
      'node',
      createNode('active', { textContent: 'true' }),
    );
    fixture.componentRef.setInput('onChange', () => {});
    await fixture.whenStable();

    const icon = el.querySelector('mat-icon');
    expect(icon?.textContent?.trim()).toBe('check_circle');
  });

  it('should show cancel icon for false value', async () => {
    fixture.componentRef.setInput(
      'node',
      createNode('active', { textContent: 'false' }),
    );
    fixture.componentRef.setInput('onChange', () => {});
    await fixture.whenStable();

    const icon = el.querySelector('mat-icon');
    expect(icon?.textContent?.trim()).toBe('cancel');
  });

  it('should compute isTrue correctly for various truthy values', () => {
    const test = (text: string, expected: boolean) => {
      fixture.componentRef.setInput(
        'node',
        createNode('b', { textContent: text }),
      );
      fixture.componentRef.setInput('onChange', () => {});
      expect(component.isTrue()).toBe(expected);
    };

    test('true', true);
    test('True', true);
    test('TRUE', true);
    test('yes', true);
    test('YES', true);
    test('1', true);
    test('false', false);
    test('no', false);
    test('0', false);
    test('', false);
    test('anything', false);
  });

  it('should call onChange with "true" when toggled on', () => {
    fixture.componentRef.setInput(
      'node',
      createNode('active', { textContent: 'false' }),
    );
    let updated = null as XmlNode | null;
    fixture.componentRef.setInput(
      'onChange',
      (n: XmlNode) => (updated = n),
    );

    component.onToggle(true);

    expect(updated!.textContent).toBe('true');
  });

  it('should call onChange with "false" when toggled off', () => {
    fixture.componentRef.setInput(
      'node',
      createNode('active', { textContent: 'true' }),
    );
    let updated = null as XmlNode | null;
    fixture.componentRef.setInput(
      'onChange',
      (n: XmlNode) => (updated = n),
    );

    component.onToggle(false);

    expect(updated!.textContent).toBe('false');
  });

  it('should render slide toggle', async () => {
    fixture.componentRef.setInput(
      'node',
      createNode('active', { textContent: 'true' }),
    );
    fixture.componentRef.setInput('onChange', () => {});
    await fixture.whenStable();

    const toggle = el.querySelector('mat-slide-toggle');
    expect(toggle).toBeTruthy();
  });

  it('should show Yes label when true', async () => {
    fixture.componentRef.setInput(
      'node',
      createNode('active', { textContent: 'true' }),
    );
    fixture.componentRef.setInput('onChange', () => {});
    await fixture.whenStable();

    const label = el.querySelector('.label-text');
    expect(label?.textContent?.trim()).toBe('Yes');
  });

  it('should show No label when false', async () => {
    fixture.componentRef.setInput(
      'node',
      createNode('active', { textContent: 'false' }),
    );
    fixture.componentRef.setInput('onChange', () => {});
    await fixture.whenStable();

    const label = el.querySelector('.label-text');
    expect(label?.textContent?.trim()).toBe('No');
  });
});
