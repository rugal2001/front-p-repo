import {
  useEditor,
  EditorContent,
  FloatingMenu,
  BubbleMenu,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import { MdCode, MdFormatListBulleted } from "react-icons/md";
import { useEffect } from "react";

// define your extension array
const extensions = [
  StarterKit.configure({
    bulletList: false, // disable the bulletList included in StarterKit
  }),
  BulletList.configure({
    HTMLAttributes: {
      class: "colored-bullet-list",
    },
    keepAttributes: true,
    keepMarks: true,
  }),
];

const content = `
<h2>1. Inline <code>&lt;code&gt;</code></h2>
    <p>You can use <code>&lt;code&gt;</code> to style short snippets like <code>const x = 42;</code>.</p>

    <h2>2. Block <code>&lt;pre&gt;&lt;code&gt;</code></h2>
    <pre><code>// This is a JavaScript example
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet("World"));</code></pre>
`;

const Tiptap = () => {
  const editor = useEditor({
    extensions,
    content,
    editorProps: {
      attributes: {
        class: "prose prose-blue max-w-none focus:outline-none",
      },
    },
  });

  if (!editor) {
    return null;
  }

  const MenuItems = [
    {
      icon: <MdFormatListBulleted />,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: <MdCode />,
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
    },
  ];
  return (
    <>
      <EditorContent className="w-full h-screen tiptap" editor={editor} />
      <FloatingMenu editor={editor}>
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-md border-[1px] border-gray-100 shadow">
          {MenuItems.map((item) => (
            <div
              onClick={item.onClick}
              className="p-1 text-lg text-gray-800 rounded-md hover:bg-gray-200"
            >
              {item.icon}
            </div>
          ))}
        </div>
      </FloatingMenu>
      <BubbleMenu editor={editor}>
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-md border-[1px] border-gray-100 shadow">
          {MenuItems.map((item) => (
            <div
              onClick={item.onClick}
              className="p-1 text-lg text-gray-800 rounded-md hover:bg-gray-200"
            >
              {item.icon}
            </div>
          ))}
        </div>
      </BubbleMenu>
    </>
  );
};

export default Tiptap;
