import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { describe, it, expect, beforeEach } from 'vitest';
import { TelephoneControl } from './telephone-control';
import {
  createNode,
  resetIdCounter,
  type XmlNode,
} from '../models/xml-node';

describe('TelephoneControl', () => {
  let fixture: ComponentFixture<TelephoneControl>;
  let component: TelephoneControl;
  let el: HTMLElement;

  beforeEach(async () => {
    resetIdCounter();
    await TestBed.configureTestingModule({
      imports: [TelephoneControl],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(TelephoneControl);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  it('should render phone icon', async () => {
    fixture.componentRef.setInput(
      'node',
      createNode('phone', { textContent: '5551234567' }),
    );
    fixture.componentRef.setInput('onChange', () => {});
    await fixture.whenStable();

    const icon = el.querySelector('mat-icon');
    expect(icon?.textContent?.trim()).toBe('phone');
  });

  it('should display phone number in input', async () => {
    fixture.componentRef.setInput(
      'node',
      createNode('phone', { textContent: '+15551234567' }),
    );
    fixture.componentRef.setInput('onChange', () => {});
    await fixture.whenStable();

    const input = el.querySelector('input') as HTMLInputElement;
    expect(input?.value).toBe('+15551234567');
  });

  it('should format 11-digit US phone for preview', () => {
    fixture.componentRef.setInput(
      'node',
      createNode('phone', { textContent: '+15551234567' }),
    );
    fixture.componentRef.setInput('onChange', () => {});
    expect(component.formattedPhone()).toBe('+1 (555) 123-4567');
  });

  it('should format 10-digit phone for preview', () => {
    fixture.componentRef.setInput(
      'node',
      createNode('phone', { textContent: '5551234567' }),
    );
    fixture.componentRef.setInput('onChange', () => {});
    expect(component.formattedPhone()).toBe('(555) 123-4567');
  });

  it('should return empty string for non-standard numbers', () => {
    fixture.componentRef.setInput(
      'node',
      createNode('phone', { textContent: '123' }),
    );
    fixture.componentRef.setInput('onChange', () => {});
    expect(component.formattedPhone()).toBe('');
  });

  it('should call onChange with updated node on input', () => {
    const node = createNode('phone', { textContent: '' });
    let updated = null as XmlNode | null;
    fixture.componentRef.setInput('node', node);
    fixture.componentRef.setInput(
      'onChange',
      (n: XmlNode) => (updated = n),
    );

    component.onPhoneChange('+15559998888');

    expect(updated!.textContent).toBe('+15559998888');
    expect(updated!.tagName).toBe('phone');
  });

  it('should respect readOnly input', async () => {
    fixture.componentRef.setInput(
      'node',
      createNode('phone', { textContent: '123' }),
    );
    fixture.componentRef.setInput('readOnly', true);
    fixture.componentRef.setInput('onChange', () => {});
    await fixture.whenStable();

    const input = el.querySelector('input') as HTMLInputElement;
    expect(input?.readOnly).toBe(true);
  });
});
