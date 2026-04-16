/**
 * Sidecar schema metadata for enhanced XML editor UX.
 * All fields optional — non-matching tags/attributes still allowed.
 */

export interface XmlAttributeDefinition {
  /** Attribute name (exact match) */
  name: string;
  /** Human-readable title */
  title?: string;
  /** Short description */
  description?: string;
  /** Material icon name */
  icon?: string;
  /** Default value when attribute is added */
  defaultValue?: string;
}

export interface XmlTagDefinition {
  /** Tag name (exact match) */
  name: string;
  /** Human-readable title */
  title?: string;
  /** Short description */
  description?: string;
  /** Material icon name */
  icon?: string;
  /** Known attributes for this tag */
  attributes?: XmlAttributeDefinition[];
  /** Attribute names that should be auto-added on creation */
  requiredAttributes?: string[];
  /** Tag names allowed as direct children */
  allowedChildren?: string[];
  /** Child tag names that should be auto-added on creation */
  requiredChildren?: string[];
}

export interface XmlSchemaDefinition {
  /** All known tag definitions */
  tags: XmlTagDefinition[];
}

/** Look up a tag definition by name. */
export function findTagDef(
  schema: XmlSchemaDefinition | undefined,
  tagName: string,
): XmlTagDefinition | undefined {
  return schema?.tags.find((t) => t.name === tagName);
}

/** Look up an attribute definition within a tag definition. */
export function findAttrDef(
  tagDef: XmlTagDefinition | undefined,
  attrName: string,
): XmlAttributeDefinition | undefined {
  return tagDef?.attributes?.find((a) => a.name === attrName);
}

/**
 * Filter tag definitions by search query.
 * Matches against name, title, description.
 */
export function filterTagDefs(
  tags: XmlTagDefinition[],
  query: string,
): XmlTagDefinition[] {
  if (!query) return tags;
  const q = query.toLowerCase();
  return tags.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q),
  );
}

/**
 * Filter attribute definitions by search query.
 * Matches against name, title, description.
 */
export function filterAttrDefs(
  attrs: XmlAttributeDefinition[],
  query: string,
): XmlAttributeDefinition[] {
  if (!query) return attrs;
  const q = query.toLowerCase();
  return attrs.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.title?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q),
  );
}
