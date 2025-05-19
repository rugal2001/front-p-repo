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

// Include a bullet list in the initial content to test styling
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

  // Apply custom styles to bullet lists after initial render
  useEffect(() => {
    if (editor) {
      // Custom styling could be applied here if needed
      const editorElement = document.querySelector(".tiptap");
      if (editorElement) {
        const lists = editorElement.querySelectorAll(
          "ul.colored-bullet-list, ul"
        );
        lists.forEach((list) => {
          list.classList.add("text-blue-500");
          const items = list.querySelectorAll("li");
          items.forEach((item) => {
            item.classList.add("text-blue-500");
          });
        });
      }
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <>
      <EditorContent className="w-full h-screen tiptap" editor={editor} />
      {/* <FloatingMenu editor={editor}>This is the floating menu</FloatingMenu> */}
      <BubbleMenu editor={editor}>
        <div
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="p-2 text-white bg-blue-500 rounded-md"
        >
          <MdFormatListBulleted />
        </div>
      </BubbleMenu>
    </>
  );
};

export default Tiptap;
