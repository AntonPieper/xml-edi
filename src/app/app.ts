import { Component, signal } from '@angular/core';
import {
  XmlEditor,
  XmlNode,
  XmlControlMapping,
  createNode,
  createAttribute,
  TelephoneControl,
  BooleanControl,
  UrlControl,
} from './xml-editor';

@Component({
  selector: 'app-root',
  imports: [XmlEditor],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  document = signal<XmlNode>(
    createNode('contacts', {
      attributes: [createAttribute('version', '1.0')],
      children: [
        createNode('person', {
          attributes: [
            createAttribute('id', '1'),
            createAttribute('role', 'admin'),
          ],
          children: [
            createNode('name', { textContent: 'John Doe' }),
            createNode('phone', {
              attributes: [createAttribute('type', 'mobile')],
              textContent: '+15551234567',
            }),
            createNode('email', { textContent: 'john@example.com' }),
            createNode('active', { textContent: 'true' }),
            createNode('website', {
              textContent: 'https://johndoe.dev',
            }),
          ],
        }),
        createNode('person', {
          attributes: [createAttribute('id', '2')],
          children: [
            createNode('name', { textContent: 'Jane Smith' }),
            createNode('phone', {
              attributes: [createAttribute('type', 'home')],
              textContent: '+15559876543',
            }),
            createNode('active', { textContent: 'false' }),
          ],
        }),
      ],
    }),
  );

  controls: XmlControlMapping[] = [
    {
      match: (node) => node.tagName === 'phone',
      component: TelephoneControl,
    },
    {
      match: (node) => node.tagName === 'active',
      component: BooleanControl,
      hideChildren: true,
    },
    {
      match: (node) =>
        node.tagName === 'website' || node.tagName === 'url',
      component: UrlControl,
    },
  ];
}
