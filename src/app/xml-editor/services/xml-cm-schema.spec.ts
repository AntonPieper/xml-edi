import { describe, it, expect } from 'vitest';
import {
  schemaToElementSpecs,
  createXmlLintSource,
} from './xml-cm-schema';
import type { XmlSchemaDefinition } from '../models/xml-schema';

const testSchema: XmlSchemaDefinition = {
  tags: [
    {
      name: 'contacts',
      title: 'Contacts List',
      description: 'Root container',
      icon: 'contacts',
      attributes: [
        {
          name: 'version',
          title: 'Version',
          description: 'Schema version',
        },
      ],
      allowedChildren: ['person'],
    },
    {
      name: 'person',
      title: 'Person',
      description: 'Contact entry',
      icon: 'person',
      attributes: [
        { name: 'id', title: 'ID', description: 'Unique identifier' },
        { name: 'role', title: 'Role' },
      ],
      requiredAttributes: ['id'],
      allowedChildren: ['name', 'phone'],
      requiredChildren: ['name'],
    },
    {
      name: 'name',
      title: 'Full Name',
      description: "Person's name",
    },
    {
      name: 'phone',
      title: 'Phone Number',
    },
  ],
};

describe('xml-cm-schema', () => {
  describe('schemaToElementSpecs', () => {
    it('should convert all tags to ElementSpec', () => {
      const specs = schemaToElementSpecs(testSchema);
      expect(specs).toHaveLength(4);
      expect(specs.map((s) => s.name)).toEqual([
        'contacts',
        'person',
        'name',
        'phone',
      ]);
    });

    it('should set children from allowedChildren', () => {
      const specs = schemaToElementSpecs(testSchema);
      const contacts = specs.find((s) => s.name === 'contacts')!;
      expect(contacts.children).toEqual(['person']);
    });

    it('should convert attributes to AttrSpec', () => {
      const specs = schemaToElementSpecs(testSchema);
      const person = specs.find((s) => s.name === 'person')!;
      expect(person.attributes).toHaveLength(2);
      const firstAttr = person.attributes![0] as { name: string };
      expect(firstAttr.name).toBe('id');
    });

    it('should set completion detail from title', () => {
      const specs = schemaToElementSpecs(testSchema);
      const person = specs.find((s) => s.name === 'person')!;
      expect(person.completion?.detail).toBe('— Person');
    });

    it('should set completion info from description', () => {
      const specs = schemaToElementSpecs(testSchema);
      const person = specs.find((s) => s.name === 'person')!;
      expect(person.completion?.info).toBe('Contact entry');
    });

    it('should set completion type for tags', () => {
      const specs = schemaToElementSpecs(testSchema);
      expect(specs[0].completion?.type).toBe('type');
    });

    it('should set completion type for attributes', () => {
      const specs = schemaToElementSpecs(testSchema);
      const person = specs.find((s) => s.name === 'person')!;
      const firstAttr = person.attributes![0] as {
        completion?: { type?: string };
      };
      expect(firstAttr.completion?.type).toBe('property');
    });

    it('should handle tags without attributes', () => {
      const specs = schemaToElementSpecs(testSchema);
      const name = specs.find((s) => s.name === 'name')!;
      expect(name.attributes).toBeUndefined();
    });

    it('should handle tags without children', () => {
      const specs = schemaToElementSpecs(testSchema);
      const name = specs.find((s) => s.name === 'name')!;
      expect(name.children).toBeUndefined();
    });

    it('should handle tags without title (no detail)', () => {
      const schema: XmlSchemaDefinition = {
        tags: [{ name: 'bare' }],
      };
      const specs = schemaToElementSpecs(schema);
      expect(specs[0].completion?.detail).toBeUndefined();
    });
  });

  describe('createXmlLintSource', () => {
    it('should return a function', () => {
      const source = createXmlLintSource(testSchema);
      expect(typeof source).toBe('function');
    });

    it('should return a function without schema', () => {
      const source = createXmlLintSource();
      expect(typeof source).toBe('function');
    });
  });
});
