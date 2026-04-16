import { Component, signal } from '@angular/core';
import {
  XmlEditor,
  XmlNode,
  XmlControlMapping,
  XmlSchemaDefinition,
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

  schema: XmlSchemaDefinition = {
    tags: [
      {
        name: 'contacts',
        title: 'Contacts List',
        description: 'Root container for contact entries',
        icon: 'contacts',
        attributes: [
          {
            name: 'version',
            title: 'Version',
            description: 'Schema version number',
            icon: 'tag',
          },
          {
            name: 'source',
            title: 'Source',
            description: 'Origin system of the contacts',
            icon: 'cloud',
          },
        ],
        allowedChildren: ['person', 'group'],
      },
      {
        name: 'person',
        title: 'Person',
        description: 'A contact entry with personal information',
        icon: 'person',
        attributes: [
          {
            name: 'id',
            title: 'ID',
            description: 'Unique identifier',
            icon: 'fingerprint',
          },
          {
            name: 'role',
            title: 'Role',
            description: 'Contact role or category',
            icon: 'badge',
          },
          {
            name: 'status',
            title: 'Status',
            description: 'Membership status',
            icon: 'verified',
          },
        ],
        requiredAttributes: ['id'],
        allowedChildren: [
          'name',
          'phone',
          'email',
          'website',
          'active',
          'address',
          'notes',
        ],
        requiredChildren: ['name'],
      },
      {
        name: 'group',
        title: 'Contact Group',
        description: 'Grouping of related contacts',
        icon: 'group',
        attributes: [
          {
            name: 'name',
            title: 'Group Name',
            description: 'Display name for this group',
          },
        ],
        allowedChildren: ['person'],
      },
      {
        name: 'name',
        title: 'Full Name',
        description: "Person's full name",
        icon: 'badge',
      },
      {
        name: 'phone',
        title: 'Phone Number',
        description: 'Contact telephone number',
        icon: 'phone',
        attributes: [
          {
            name: 'type',
            title: 'Type',
            description: 'Phone type (mobile, home, work)',
            icon: 'category',
          },
        ],
      },
      {
        name: 'email',
        title: 'Email Address',
        description: 'Contact email address',
        icon: 'email',
      },
      {
        name: 'website',
        title: 'Website URL',
        description: 'Personal or company website',
        icon: 'language',
      },
      {
        name: 'active',
        title: 'Active Status',
        description: 'Whether the contact is currently active',
        icon: 'toggle_on',
      },
      {
        name: 'address',
        title: 'Mailing Address',
        description: 'Physical mailing address',
        icon: 'location_on',
        allowedChildren: ['street', 'city', 'state', 'zip', 'country'],
      },
      {
        name: 'street',
        title: 'Street',
        description: 'Street address line',
        icon: 'signpost',
      },
      {
        name: 'city',
        title: 'City',
        description: 'City name',
        icon: 'location_city',
      },
      {
        name: 'state',
        title: 'State/Province',
        description: 'State or province code',
      },
      {
        name: 'zip',
        title: 'ZIP/Postal Code',
        description: 'Postal or ZIP code',
      },
      {
        name: 'country',
        title: 'Country',
        description: 'Country name or ISO code',
        icon: 'flag',
      },
      {
        name: 'notes',
        title: 'Notes',
        description: 'Free-form notes about the contact',
        icon: 'sticky_note_2',
      },
    ],
  };
}
