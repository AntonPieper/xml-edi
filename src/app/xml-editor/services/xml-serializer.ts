import { XmlNode, XmlAttribute, generateId } from '../models/xml-node';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function serializeXml(node: XmlNode, indent: number = 0): string {
  const pad = '  '.repeat(indent);
  let xml = `${pad}<${node.tagName}`;

  for (const attr of node.attributes) {
    if (attr.name) {
      xml += ` ${attr.name}="${escapeXml(attr.value)}"`;
    }
  }

  const hasChildren = node.children.length > 0;
  const hasText = node.textContent.trim().length > 0;

  if (!hasChildren && !hasText) {
    xml += ' />';
    return xml;
  }

  xml += '>';

  if (hasText && !hasChildren) {
    xml += escapeXml(node.textContent);
    xml += `</${node.tagName}>`;
    return xml;
  }

  if (hasText) {
    xml += `\n${pad}  ${escapeXml(node.textContent)}`;
  }

  for (const child of node.children) {
    xml += '\n' + serializeXml(child, indent + 1);
  }

  xml += `\n${pad}</${node.tagName}>`;
  return xml;
}

function elementToNode(element: Element): XmlNode {
  const attributes: XmlAttribute[] = [];
  for (const attr of Array.from(element.attributes)) {
    attributes.push({
      id: generateId(),
      name: attr.name,
      value: attr.value,
    });
  }

  const children: XmlNode[] = [];
  let textContent = '';

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(elementToNode(child as Element));
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim() ?? '';
      if (text) {
        textContent += (textContent ? ' ' : '') + text;
      }
    }
  }

  return {
    id: generateId(),
    tagName: element.tagName.toLowerCase(),
    attributes,
    children,
    textContent,
  };
}

export function parseXml(xmlString: string): XmlNode {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString.trim(), 'text/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    throw new Error(`XML parse error: ${errorNode.textContent}`);
  }
  return elementToNode(doc.documentElement);
}
