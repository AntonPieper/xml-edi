import { describe, it, expect } from 'vitest';
import {
  filterTagDefs,
  filterAttrDefs,
  findTagDef,
  findAttrDef,
  type XmlSchemaDefinition,
  type XmlTagDefinition,
  type XmlAttributeDefinition,
} from './xml-schema';

const testSchema: XmlSchemaDefinition = {
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
          description: 'Schema version',
          icon: 'tag',
        },
        {
          name: 'source',
          title: 'Source',
          description: 'Origin system',
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
      allowedChildren: ['name', 'phone', 'email'],
      requiredChildren: ['name'],
    },
    {
      name: 'phone',
      title: 'Phone Number',
      description: 'Telephone number',
      icon: 'phone',
      attributes: [{ name: 'type', title: 'Type' }],
    },
    {
      name: 'name',
      title: 'Full Name',
      description: "Person's name",
    },
    {
      name: 'email',
      title: 'Email',
      description: 'Email address',
      icon: 'email',
    },
  ],
};

describe('XmlSchema', () => {
  describe('findTagDef', () => {
    it('should find existing tag', () => {
      const def = findTagDef(testSchema, 'person');
      expect(def?.name).toBe('person');
      expect(def?.title).toBe('Person');
      expect(def?.icon).toBe('person');
    });

    it('should return undefined for unknown tag', () => {
      expect(findTagDef(testSchema, 'nope')).toBeUndefined();
    });

    it('should return undefined when schema undefined', () => {
      expect(findTagDef(undefined, 'person')).toBeUndefined();
    });
  });

  describe('findAttrDef', () => {
    it('should find existing attribute', () => {
      const tagDef = findTagDef(testSchema, 'contacts');
      const attrDef = findAttrDef(tagDef, 'version');
      expect(attrDef?.name).toBe('version');
      expect(attrDef?.title).toBe('Version');
    });

    it('should return undefined for unknown attribute', () => {
      const tagDef = findTagDef(testSchema, 'contacts');
      expect(findAttrDef(tagDef, 'nope')).toBeUndefined();
    });

    it('should return undefined when tagDef undefined', () => {
      expect(findAttrDef(undefined, 'version')).toBeUndefined();
    });
  });

  describe('filterTagDefs', () => {
    const tags = testSchema.tags;

    it('should return all when query empty', () => {
      expect(filterTagDefs(tags, '')).toEqual(tags);
    });

    it('should filter by name', () => {
      const result = filterTagDefs(tags, 'phone');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('phone');
    });

    it('should filter by title', () => {
      const result = filterTagDefs(tags, 'Full Name');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('name');
    });

    it('should filter by description', () => {
      const result = filterTagDefs(tags, 'Contact entry');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('person');
    });

    it('should be case-insensitive', () => {
      const result = filterTagDefs(tags, 'EMAIL');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('email');
    });

    it('should return empty for no match', () => {
      expect(filterTagDefs(tags, 'zzzzz')).toEqual([]);
    });

    it('should match partial strings', () => {
      const result = filterTagDefs(tags, 'con');
      // matches 'contacts' name + 'Contact entry' description of person
      expect(result.length).toBe(2);
    });
  });

  describe('filterAttrDefs', () => {
    const attrs = testSchema.tags[0].attributes!; // contacts attrs

    it('should return all when query empty', () => {
      expect(filterAttrDefs(attrs, '')).toEqual(attrs);
    });

    it('should filter by name', () => {
      const result = filterAttrDefs(attrs, 'source');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('source');
    });

    it('should filter by title', () => {
      const result = filterAttrDefs(attrs, 'Version');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('version');
    });

    it('should filter by description', () => {
      const result = filterAttrDefs(attrs, 'Origin');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('source');
    });

    it('should be case-insensitive', () => {
      expect(filterAttrDefs(attrs, 'VERSION').length).toBe(1);
    });
  });

  describe('schema structure', () => {
    it('should have requiredAttributes', () => {
      const def = findTagDef(testSchema, 'person');
      expect(def?.requiredAttributes).toEqual(['id']);
    });

    it('should have allowedChildren', () => {
      const def = findTagDef(testSchema, 'person');
      expect(def?.allowedChildren).toContain('name');
      expect(def?.allowedChildren).toContain('phone');
    });

    it('should have requiredChildren', () => {
      const def = findTagDef(testSchema, 'person');
      expect(def?.requiredChildren).toEqual(['name']);
    });
  });
});
