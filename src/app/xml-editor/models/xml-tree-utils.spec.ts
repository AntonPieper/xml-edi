import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNode,
  resetIdCounter,
  type XmlNode,
} from '../models/xml-node';
import {
  updateNodeInTree,
  removeNodeFromTree,
  addChildToNode,
  findNodeById,
  countNodes,
  resolveNodeByPath,
  buildBreadcrumbs,
} from './xml-tree-utils';

// re-export moved file
describe('XmlTreeUtils', () => {
  let root: XmlNode;

  beforeEach(() => {
    resetIdCounter();
    root = createNode('root', {
      children: [
        createNode('child1', {
          children: [createNode('grandchild')],
        }),
        createNode('child2'),
      ],
    });
  });

  describe('findNodeById', () => {
    it('should find root node', () => {
      const found = findNodeById(root, root.id);
      expect(found).toBe(root);
    });

    it('should find direct child', () => {
      const found = findNodeById(root, root.children[0].id);
      expect(found?.tagName).toBe('child1');
    });

    it('should find deeply nested node', () => {
      const gcId = root.children[0].children[0].id;
      const found = findNodeById(root, gcId);
      expect(found?.tagName).toBe('grandchild');
    });

    it('should return null for non-existent id', () => {
      expect(findNodeById(root, 'does-not-exist')).toBeNull();
    });
  });

  describe('updateNodeInTree', () => {
    it('should update root node', () => {
      const updated = updateNodeInTree(root, root.id, (n) => ({
        ...n,
        tagName: 'newRoot',
      }));
      expect(updated.tagName).toBe('newRoot');
      expect(updated.children).toHaveLength(2);
    });

    it('should update direct child', () => {
      const childId = root.children[0].id;
      const updated = updateNodeInTree(root, childId, (n) => ({
        ...n,
        tagName: 'updated',
      }));
      expect(updated.children[0].tagName).toBe('updated');
      expect(updated.children[1].tagName).toBe('child2');
    });

    it('should update deeply nested node', () => {
      const gcId = root.children[0].children[0].id;
      const updated = updateNodeInTree(root, gcId, (n) => ({
        ...n,
        textContent: 'modified',
      }));
      expect(updated.children[0].children[0].textContent).toBe(
        'modified',
      );
    });

    it('should return same reference when node not found', () => {
      const updated = updateNodeInTree(root, 'nope', (n) => ({
        ...n,
        tagName: 'x',
      }));
      expect(updated).toBe(root);
    });

    it('should only create new references along the update path', () => {
      const childId = root.children[0].id;
      const updated = updateNodeInTree(root, childId, (n) => ({
        ...n,
        tagName: 'changed',
      }));
      expect(updated).not.toBe(root);
      expect(updated.children[0]).not.toBe(root.children[0]);
      // child2 not changed → same reference
      expect(updated.children[1]).toBe(root.children[1]);
    });
  });

  describe('removeNodeFromTree', () => {
    it('should remove direct child', () => {
      const child2Id = root.children[1].id;
      const updated = removeNodeFromTree(root, child2Id);
      expect(updated.children).toHaveLength(1);
      expect(updated.children[0].tagName).toBe('child1');
    });

    it('should remove deeply nested node', () => {
      const gcId = root.children[0].children[0].id;
      const updated = removeNodeFromTree(root, gcId);
      expect(updated.children[0].children).toHaveLength(0);
      expect(updated.children).toHaveLength(2);
    });

    it('should not modify tree when id not found', () => {
      const updated = removeNodeFromTree(root, 'nonexistent');
      expect(updated.children).toHaveLength(2);
      expect(updated.children[0].children).toHaveLength(1);
    });
  });

  describe('addChildToNode', () => {
    it('should add child to root', () => {
      const newChild = createNode('newChild');
      const updated = addChildToNode(root, root.id, newChild);
      expect(updated.children).toHaveLength(3);
      expect(updated.children[2].tagName).toBe('newChild');
    });

    it('should add child to nested node', () => {
      const newGc = createNode('newGrandchild');
      const updated = addChildToNode(
        root,
        root.children[1].id,
        newGc,
      );
      expect(updated.children[1].children).toHaveLength(1);
      expect(updated.children[1].children[0].tagName).toBe(
        'newGrandchild',
      );
    });

    it('should preserve existing children when adding', () => {
      const newChild = createNode('new');
      const updated = addChildToNode(
        root,
        root.children[0].id,
        newChild,
      );
      expect(updated.children[0].children).toHaveLength(2);
      expect(updated.children[0].children[0].tagName).toBe(
        'grandchild',
      );
      expect(updated.children[0].children[1].tagName).toBe('new');
    });
  });

  describe('countNodes', () => {
    it('should count all nodes in tree', () => {
      expect(countNodes(root)).toBe(4);
    });

    it('should count single node', () => {
      expect(countNodes(createNode('solo'))).toBe(1);
    });

    it('should count after adding nodes', () => {
      const updated = addChildToNode(
        root,
        root.id,
        createNode('extra'),
      );
      expect(countNodes(updated)).toBe(5);
    });
  });

  describe('resolveNodeByPath', () => {
    it('should return root for empty path', () => {
      const node = resolveNodeByPath(root, []);
      expect(node).toBe(root);
    });

    it('should resolve direct child', () => {
      const node = resolveNodeByPath(root, [root.children[0].id]);
      expect(node.tagName).toBe('child1');
    });

    it('should resolve deeply nested node', () => {
      const gcId = root.children[0].children[0].id;
      const node = resolveNodeByPath(root, [
        root.children[0].id,
        gcId,
      ]);
      expect(node.tagName).toBe('grandchild');
    });

    it('should return deepest valid node for broken path', () => {
      const node = resolveNodeByPath(root, [
        root.children[0].id,
        'nonexistent',
      ]);
      expect(node.tagName).toBe('child1');
    });
  });

  describe('buildBreadcrumbs', () => {
    it('should return root only for empty path', () => {
      const crumbs = buildBreadcrumbs(root, []);
      expect(crumbs).toHaveLength(1);
      expect(crumbs[0].tagName).toBe('root');
    });

    it('should build full breadcrumb trail', () => {
      const gcId = root.children[0].children[0].id;
      const crumbs = buildBreadcrumbs(root, [
        root.children[0].id,
        gcId,
      ]);
      expect(crumbs).toHaveLength(3);
      expect(crumbs[0].tagName).toBe('root');
      expect(crumbs[1].tagName).toBe('child1');
      expect(crumbs[2].tagName).toBe('grandchild');
    });

    it('should truncate at broken path step', () => {
      const crumbs = buildBreadcrumbs(root, [
        root.children[0].id,
        'invalid',
      ]);
      expect(crumbs).toHaveLength(2);
      expect(crumbs[1].tagName).toBe('child1');
    });
  });
});
