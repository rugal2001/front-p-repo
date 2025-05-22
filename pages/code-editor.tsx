import { useState } from "react";
import Tiptap from "../components/tiptap";

export default function CodeEditorPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tiptap Code Editor Demo</h1>
      <p className="mb-4">
        Click the code icon in the floating menu to add a code block, then
        select a language from the dropdown.
      </p>
      <div className="relative">
        <Tiptap />
      </div>
    </div>
  );
}
