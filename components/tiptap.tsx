import {
  useEditor,
  EditorContent,
  FloatingMenu,
  BubbleMenu,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import { MdFormatListBulleted } from "react-icons/md";
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
<p>Hello World!</p>
<ul class="colored-bullet-list">
  <li><p>First item in the bullet list</p></li>
  <li><p>Second item in the bullet list</p></li>
</ul>
<p>More text after the list</p>
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
