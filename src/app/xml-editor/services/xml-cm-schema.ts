import type { ElementSpec } from '@codemirror/lang-xml';
import type { Diagnostic } from '@codemirror/lint';
import type { EditorView } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import type { XmlSchemaDefinition } from '../models/xml-schema';

/**
 * Convert our schema to CodeMirror 6 ElementSpec[] for autocompletion.
 * CM6 uses allowedChildren to context-filter tag suggestions.
 */
export function schemaToElementSpecs(
  schema: XmlSchemaDefinition,
): ElementSpec[] {
  return schema.tags.map((tag) => ({
    name: tag.name,
    children: tag.allowedChildren,
    attributes: tag.attributes?.map((attr) => ({
      name: attr.name,
      completion: {
        detail: attr.title ? `— ${attr.title}` : undefined,
        info: attr.description,
        type: 'property' as const,
      },
    })),
    completion: {
      detail: tag.title ? `— ${tag.title}` : undefined,
      info: tag.description,
      type: 'type' as const,
    },
  }));
}

/**
 * Lint source that validates XML against schema + detects syntax errors.
 * Uses Lezer parse tree — reads only small slices via doc.sliceString(from, to).
 */
export function createXmlLintSource(schema?: XmlSchemaDefinition) {
  const tagMap = schema
    ? new Map(schema.tags.map((t) => [t.name, t]))
    : null;

  return (view: EditorView): Diagnostic[] => {
    const diagnostics: Diagnostic[] = [];
    const { state } = view;
    const tree = syntaxTree(state);

    tree.iterate({
      enter(cursor) {
        // ── Syntax errors ──
        if (cursor.type.isError) {
          diagnostics.push({
            from: cursor.from,
            to: Math.max(cursor.from + 1, cursor.to),
            severity: 'error',
            message: 'XML syntax error',
          });
          return;
        }

        if (cursor.name === 'MismatchedCloseTag') {
          diagnostics.push({
            from: cursor.from,
            to: cursor.to,
            severity: 'error',
            message: 'Mismatched closing tag',
          });
          return;
        }

        // ── Schema validation ──
        if (!tagMap || cursor.name !== 'Element') return;

        const node = cursor.node;
        const openTag =
          node.getChild('OpenTag') ?? node.getChild('SelfClosingTag');
        if (!openTag) return;

        const tagNameNode = openTag.getChild('TagName');
        if (!tagNameNode) return;

        const tagName = state.doc.sliceString(
          tagNameNode.from,
          tagNameNode.to,
        );
        const tagDef = tagMap.get(tagName);

        if (!tagDef) {
          diagnostics.push({
            from: tagNameNode.from,
            to: tagNameNode.to,
            severity: 'info',
            message: `Unknown element <${tagName}>`,
          });
          return;
        }

        // Validate attributes
        const attrNodes = openTag.getChildren('Attribute');
        const foundAttrs = new Set<string>();

        for (const attrNode of attrNodes) {
          const nameNode = attrNode.getChild('AttributeName');
          if (!nameNode) continue;
          const attrName = state.doc.sliceString(
            nameNode.from,
            nameNode.to,
          );
          foundAttrs.add(attrName);

          if (tagDef.attributes?.length) {
            const known = tagDef.attributes.some(
              (a) => a.name === attrName,
            );
            if (!known) {
              diagnostics.push({
                from: nameNode.from,
                to: nameNode.to,
                severity: 'info',
                message: `Unknown attribute "${attrName}" on <${tagName}>`,
              });
            }
          }
        }

        // Required attributes
        if (tagDef.requiredAttributes) {
          for (const req of tagDef.requiredAttributes) {
            if (!foundAttrs.has(req)) {
              diagnostics.push({
                from: tagNameNode.from,
                to: tagNameNode.to,
                severity: 'warning',
                message: `Missing required attribute "${req}"`,
              });
            }
          }
        }

        // Validate children
        const childElements = node.getChildren('Element');
        const foundChildren = new Set<string>();

        for (const child of childElements) {
          const childOpen =
            child.getChild('OpenTag') ??
            child.getChild('SelfClosingTag');
          if (!childOpen) continue;
          const childNameNode = childOpen.getChild('TagName');
          if (!childNameNode) continue;
          const childName = state.doc.sliceString(
            childNameNode.from,
            childNameNode.to,
          );
          foundChildren.add(childName);

          if (
            tagDef.allowedChildren &&
            !tagDef.allowedChildren.includes(childName)
          ) {
            diagnostics.push({
              from: childNameNode.from,
              to: childNameNode.to,
              severity: 'warning',
              message: `<${childName}> not allowed inside <${tagName}>`,
            });
          }
        }

        // Required children
        if (tagDef.requiredChildren) {
          for (const req of tagDef.requiredChildren) {
            if (!foundChildren.has(req)) {
              diagnostics.push({
                from: tagNameNode.from,
                to: tagNameNode.to,
                severity: 'info',
                message: `Missing child <${req}> in <${tagName}>`,
              });
            }
          }
        }
      },
    });

    return diagnostics;
  };
}
