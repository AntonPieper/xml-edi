import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNode,
  createAttribute,
  resetIdCounter,
} from '../models/xml-node';
import { serializeXml, parseXml } from './xml-serializer';

describe('XmlSerializer', () => {
  beforeEach(() => resetIdCounter());

  describe('serializeXml', () => {
    it('should serialize empty element as self-closing', () => {
      const node = createNode('root');
      expect(serializeXml(node)).toBe('<root />');
    });

    it('should serialize element with text content inline', () => {
      const node = createNode('name', { textContent: 'John' });
      expect(serializeXml(node)).toBe('<name>John</name>');
    });

    it('should serialize element with attributes', () => {
      const node = createNode('person', {
        attributes: [createAttribute('id', '1')],
      });
      expect(serializeXml(node)).toBe('<person id="1" />');
    });

    it('should serialize multiple attributes', () => {
      const node = createNode('el', {
        attributes: [
          createAttribute('a', '1'),
          createAttribute('b', '2'),
        ],
      });
      expect(serializeXml(node)).toBe('<el a="1" b="2" />');
    });

    it('should serialize nested elements with indentation', () => {
      const node = createNode('root', {
        children: [createNode('child', { textContent: 'hello' })],
      });
      expect(serializeXml(node)).toBe(
        '<root>\n  <child>hello</child>\n</root>',
      );
    });

    it('should serialize deeply nested elements', () => {
      const node = createNode('a', {
        children: [
          createNode('b', {
            children: [createNode('c', { textContent: 'deep' })],
          }),
        ],
      });
      const expected =
        '<a>\n  <b>\n    <c>deep</c>\n  </b>\n</a>';
      expect(serializeXml(node)).toBe(expected);
    });

    it('should escape special XML characters in text', () => {
      const node = createNode('data', {
        textContent: 'a & b < c > d "e" \'f\'',
      });
      expect(serializeXml(node)).toContain('&amp;');
      expect(serializeXml(node)).toContain('&lt;');
      expect(serializeXml(node)).toContain('&gt;');
      expect(serializeXml(node)).toContain('&quot;');
      expect(serializeXml(node)).toContain('&apos;');
    });

    it('should escape special characters in attribute values', () => {
      const node = createNode('el', {
        attributes: [createAttribute('val', 'a&b')],
      });
      expect(serializeXml(node)).toBe('<el val="a&amp;b" />');
    });

    it('should skip attributes with empty names', () => {
      const node = createNode('el', {
        attributes: [createAttribute('', 'val')],
      });
      expect(serializeXml(node)).toBe('<el />');
    });

    it('should serialize element with both text and children', () => {
      const node = createNode('mixed', {
        textContent: 'some text',
        children: [createNode('child')],
      });
      const result = serializeXml(node);
      expect(result).toContain('some text');
      expect(result).toContain('<child />');
    });
  });

  describe('parseXml', () => {
    it('should parse a self-closing element', () => {
      const node = parseXml('<root />');
      expect(node.tagName).toBe('root');
      expect(node.attributes).toHaveLength(0);
      expect(node.children).toHaveLength(0);
      expect(node.textContent).toBe('');
    });

    it('should parse element with text content', () => {
      const node = parseXml('<name>John Doe</name>');
      expect(node.tagName).toBe('name');
      expect(node.textContent).toBe('John Doe');
    });

    it('should parse element with attributes', () => {
      const node = parseXml('<person id="1" type="admin" />');
      expect(node.attributes).toHaveLength(2);
      expect(node.attributes[0].name).toBe('id');
      expect(node.attributes[0].value).toBe('1');
      expect(node.attributes[1].name).toBe('type');
      expect(node.attributes[1].value).toBe('admin');
    });

    it('should parse nested elements', () => {
      const node = parseXml(
        '<root><child>hello</child><other /></root>',
      );
      expect(node.children).toHaveLength(2);
      expect(node.children[0].tagName).toBe('child');
      expect(node.children[0].textContent).toBe('hello');
      expect(node.children[1].tagName).toBe('other');
    });

    it('should convert tag names to lowercase', () => {
      const node = parseXml('<RootElement />');
      expect(node.tagName).toBe('rootelement');
    });

    it('should assign unique IDs to each node', () => {
      const node = parseXml(
        '<root><a /><b /></root>',
      );
      const ids = new Set([
        node.id,
        node.children[0].id,
        node.children[1].id,
      ]);
      expect(ids.size).toBe(3);
    });

    it('should throw on invalid XML', () => {
      expect(() => parseXml('<invalid><unclosed>')).toThrow(
        /XML parse error/,
      );
    });

    it('should throw on completely broken XML', () => {
      expect(() => parseXml('not xml at all')).toThrow();
    });
  });

  describe('round-trip', () => {
    it('should maintain structure through parse → serialize → parse', () => {
      const xml =
        '<contacts version="1.0"><person id="1"><name>John</name><active>true</active></person></contacts>';
      const parsed = parseXml(xml);
      const serialized = serializeXml(parsed);
      const reparsed = parseXml(serialized);

      expect(reparsed.tagName).toBe(parsed.tagName);
      expect(reparsed.attributes.length).toBe(parsed.attributes.length);
      expect(reparsed.attributes[0].name).toBe(
        parsed.attributes[0].name,
      );
      expect(reparsed.children.length).toBe(parsed.children.length);
      expect(reparsed.children[0].tagName).toBe(
        parsed.children[0].tagName,
      );
      expect(reparsed.children[0].children.length).toBe(
        parsed.children[0].children.length,
      );
    });

    it('should preserve text content through round-trip', () => {
      const xml = '<msg>Hello World</msg>';
      const parsed = parseXml(xml);
      const serialized = serializeXml(parsed);
      const reparsed = parseXml(serialized);
      expect(reparsed.textContent).toBe('Hello World');
    });

    it('should preserve attribute values through round-trip', () => {
      const xml = '<el key="value" num="42" />';
      const parsed = parseXml(xml);
      const serialized = serializeXml(parsed);
      const reparsed = parseXml(serialized);
      expect(reparsed.attributes).toHaveLength(2);
      const numAttr = reparsed.attributes.find(a => a.name === 'num');
      expect(numAttr?.value).toBe('42');
    });
  });
});
