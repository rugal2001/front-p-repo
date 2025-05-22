import * as React from "react";

declare module "react-dom" {
  export function createPortal(
    children: React.ReactNode,
    container: Element
  ): React.ReactPortal;
  // Add other methods as needed
  export default ReactDOM;
}
