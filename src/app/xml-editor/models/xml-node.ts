export interface XmlNode {
  readonly id: string;
  tagName: string;
  attributes: XmlAttribute[];
  children: XmlNode[];
  textContent: string;
}

export interface XmlAttribute {
  readonly id: string;
  name: string;
  value: string;
}

let nextId = 0;

export function generateId(): string {
  return `xn-${nextId++}`;
}

export function resetIdCounter(): void {
  nextId = 0;
}

export function createNode(
  tagName: string,
  options?: Partial<Omit<XmlNode, 'id'>>,
): XmlNode {
  return {
    id: generateId(),
    tagName,
    attributes: options?.attributes ?? [],
    children: options?.children ?? [],
    textContent: options?.textContent ?? '',
  };
}

export function createAttribute(
  name: string = '',
  value: string = '',
): XmlAttribute {
  return { id: generateId(), name, value };
}
