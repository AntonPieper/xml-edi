import { Type } from '@angular/core';
import { XmlNode } from './xml-node';

/**
 * Maps a predicate to a custom control component.
 * When a node matches, the control replaces the default editor body.
 */
export interface XmlControlMapping {
  /** Return true if this control should render the given node */
  match: (node: XmlNode) => boolean;
  /** Component type to render */
  component: Type<any>;
  /** Hide children section when this control is active. Default: false */
  hideChildren?: boolean;
}
