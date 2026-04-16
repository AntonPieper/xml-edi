import { XmlNode } from './xml-node';

export function updateNodeInTree(
  root: XmlNode,
  nodeId: string,
  updater: (node: XmlNode) => XmlNode,
): XmlNode {
  if (root.id === nodeId) return updater(root);
  const updatedChildren = root.children.map((child) =>
    updateNodeInTree(child, nodeId, updater),
  );
  if (updatedChildren.every((child, i) => child === root.children[i])) {
    return root;
  }
  return { ...root, children: updatedChildren };
}

export function removeNodeFromTree(
  root: XmlNode,
  nodeId: string,
): XmlNode {
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== nodeId)
      .map((child) => removeNodeFromTree(child, nodeId)),
  };
}

export function addChildToNode(
  root: XmlNode,
  parentId: string,
  child: XmlNode,
): XmlNode {
  return updateNodeInTree(root, parentId, (node) => ({
    ...node,
    children: [...node.children, child],
  }));
}

export function findNodeById(
  root: XmlNode,
  nodeId: string,
): XmlNode | null {
  if (root.id === nodeId) return root;
  for (const child of root.children) {
    const found = findNodeById(child, nodeId);
    if (found) return found;
  }
  return null;
}

export function countNodes(root: XmlNode): number {
  return (
    1 + root.children.reduce((sum, child) => sum + countNodes(child), 0)
  );
}

/**
 * Walk a path of child IDs from root. Returns the deepest valid node.
 */
export function resolveNodeByPath(
  root: XmlNode,
  path: string[],
): XmlNode {
  let current = root;
  for (const id of path) {
    const child = current.children.find((c) => c.id === id);
    if (!child) return current;
    current = child;
  }
  return current;
}

export interface BreadcrumbItem {
  id: string;
  tagName: string;
}

export function buildBreadcrumbs(
  root: XmlNode,
  path: string[],
): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [
    { id: root.id, tagName: root.tagName },
  ];
  let current = root;
  for (const id of path) {
    const child = current.children.find((c) => c.id === id);
    if (!child) break;
    crumbs.push({ id: child.id, tagName: child.tagName });
    current = child;
  }
  return crumbs;
}
