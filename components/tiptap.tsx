import {
  useEditor,
  EditorContent,
  FloatingMenu,
  BubbleMenu,
  Editor,
} from "@tiptap/react";
import { IoMdClose, IoMdTrash } from "react-icons/io";
import { FaCheck } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";

import BulletList from "@tiptap/extension-bullet-list";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import { common, createLowlight } from "lowlight";
import {
  MdCode,
  MdFormatListBulleted,
  MdFormatQuote,
  MdLink,
  MdLooksOne,
  MdLooksTwo,
  MdLooks3,
} from "react-icons/md";
import {
  LuBold,
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuItalic,
  LuUnderline,
} from "react-icons/lu";
import {
  useState,
  useEffect,
  useRef,
  KeyboardEvent,
  ChangeEvent,
  useCallback,
  FormEvent,
} from "react";

// Import additional languages for syntax highlighting
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import { Input } from "./shadcn/input";

// Create lowlight instance with all languages
const lowlight = createLowlight(common);
lowlight.register("javascript", javascript);
lowlight.register("typescript", typescript);
lowlight.register("python", python);
lowlight.register("css", css);
lowlight.register("html", xml);

// Create custom extension for code blocks with language switcher
const CustomCodeBlockLowlight = CodeBlockLowlight.extend({
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement("div");
      dom.classList.add("code-block-with-lang");

      const toolbar = document.createElement("div");
      toolbar.classList.add("code-editor-toolbar");

      const label = document.createElement("span");
      label.classList.add("code-editor-label");
      label.textContent = "";
      toolbar.appendChild(label);

      // Create a wrapper for the select to style it better
      const selectWrapper = document.createElement("div");
      selectWrapper.classList.add("select-wrapper");

      const select = document.createElement("select");
      select.classList.add("code-editor-language-select");

      const languages = [
        { value: "javascript", label: "JavaScript" },
        { value: "python", label: "Python" },
        { value: "typescript", label: "TypeScript" },
        { value: "html", label: "HTML" },
        { value: "css", label: "CSS" },
      ];

      languages.forEach((lang) => {
        const option = document.createElement("option");
        option.value = lang.value;
        option.textContent = lang.label;
        select.appendChild(option);
      });

      // Set the current language
      select.value = node.attrs.language || "javascript";

      // Apply the language class to the parent for styling
      dom.dataset.language = select.value;

      // Handle language change
      select.addEventListener("change", (e) => {
        const target = e.target as HTMLSelectElement;
        const newLanguage = target.value;

        if (getPos && editor.isEditable) {
          // Update the language attribute on the node
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              tr.setNodeMarkup(getPos(), undefined, {
                ...node.attrs,
                language: newLanguage,
              });
              return true;
            })
            .run();

          // Update the data-language attribute for CSS styling
          dom.dataset.language = newLanguage;

          // Force re-highlighting
          setTimeout(() => {
            const codeElements = dom.querySelectorAll("pre code");
            codeElements.forEach((codeEl) => {
              // Remove old language classes
              codeEl.className = "";
              // Add new language class
              codeEl.classList.add(`language-${newLanguage}`);

              // Special treatment for HTML to ensure tag highlighting
              if (newLanguage === "html") {
                const tagRegex = /(&lt;[\w\/!]+&gt;|<[\w\/!]+>)/g;
                const attrRegex = /\s(\w+)=/g;
                const htmlContent = codeEl.innerHTML;

                // Replace HTML tags with highlighted versions if not already highlighted
                if (!htmlContent.includes('<span class="hljs-tag">')) {
                  codeEl.innerHTML = htmlContent
                    .replace(tagRegex, '<span class="hljs-tag">$1</span>')
                    .replace(attrRegex, ' <span class="hljs-attr">$1</span>=');
                }
              }
            });
          }, 10);
        }
      });

      selectWrapper.appendChild(select);
      toolbar.appendChild(selectWrapper);
      dom.appendChild(toolbar);

      const content = document.createElement("div");
      content.classList.add("code-block-content");
      dom.appendChild(content);

      return {
        dom,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;

          // Update language when node is updated
          const newLanguage = updatedNode.attrs.language || "javascript";
          select.value = newLanguage;
          dom.dataset.language = newLanguage;

          return true;
        },
      };
    };
  },
});

// define your extension array
const extensions = [
  StarterKit.configure({
    bulletList: false, // disable the bulletList included in StarterKit
    codeBlock: false, // disable the default code block
    heading: {
      levels: [1, 2, 3],
      HTMLAttributes: {
        class: "tiptap-heading",
      },
    },
  }),
  Bold.configure({
    HTMLAttributes: {
      class: "font-bold",
    },
  }),
  Italic.configure({
    HTMLAttributes: {
      class: "font-italic",
    },
  }),
  Underline.configure({
    HTMLAttributes: {
      class: "underline",
    },
  }),
  BulletList.configure({
    HTMLAttributes: {
      class: "colored-bullet-list",
    },
    keepAttributes: true,
    keepMarks: true,
  }),
  CustomCodeBlockLowlight.configure({
    lowlight,
    defaultLanguage: "javascript",
    HTMLAttributes: {
      class: "code-block",
    },
  }),
  Link.configure({
    openOnClick: true,
    HTMLAttributes: {
      class: "custom-link",
      rel: "noopener noreferrer",
    },
  }),
];

const content = `
<h1>Heading 1</h1>
<h2>1. Inline <code>&lt;code&gt;</code></h2>
    <p>You can use <code>&lt;code&gt;</code> to style short snippets like <code>const x = 42;</code>.</p>

    <h2>2. Block <code>&lt;pre&gt;&lt;code&gt;</code></h2>
    <pre><code class="language-javascript">// This is a JavaScript example
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet("World"));</code></pre>

<h3>HTML Example</h3>
<pre><code class="language-html">&lt;html&gt;
&lt;head&gt;&lt;/head&gt;
&lt;body&gt;&lt;/body&gt;
&lt;/html&gt;</code></pre>

<h3>CSS Example</h3>
<pre><code class="language-css">body {
  font-family: 'Arial', sans-serif;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}</code></pre>

<h3>Python Example</h3>
<pre><code class="language-python">def greet(name):
    return f"Hello, {name}!"

print(greet("World"))</code></pre>
`;

const Tiptap = () => {
  // Simple state to track if we're showing the link input
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkPosition, setLinkPosition] = useState({ top: 0, left: 0 });
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions,
    content,
    editorProps: {
      attributes: {
        class: "prose prose-blue max-w-none focus:outline-none",
      },
    },
  });

  // Add link styling
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .ProseMirror a {
        color: #3b82f6;
        text-decoration: underline;
      }
      .ProseMirror a:hover {
        color: #2563eb;
      }
      
      .ProseMirror h1 {
        font-size: 2rem;
        line-height: 2.5rem;
        font-weight: 700;
        margin-top: 1.5rem;
        margin-bottom: 0.5rem;
      }
      
      .ProseMirror h2 {
        font-size: 1.5rem;
        line-height: 2rem;
        font-weight: 600;
        margin-top: 1.25rem;
        margin-bottom: 0.5rem;
      }
      
      .ProseMirror h3 {
        font-size: 1.25rem;
        line-height: 1.75rem;
        font-weight: 600;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
      }
      
      /* Heading selection styles */
      .ProseMirror h1.is-editor-selected,
      .ProseMirror h2.is-editor-selected,
      .ProseMirror h3.is-editor-selected {
        background-color: rgba(59, 130, 246, 0.1);
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  if (!editor) {
    return null;
  }

  const toggleCodeBlock = () => {
    editor.chain().focus().toggleCodeBlock().run();
  };

  const openLinkMenu = () => {
    // Get current selection position
    const { view } = editor;
    if (view && view.state) {
      const { from } = view.state.selection;
      const coords = view.coordsAtPos(from);

      // Set position for popup
      setLinkPosition({
        top: coords.bottom + 10,
        left: coords.left,
      });

      // Get current link if it exists
      const attrs = editor.getAttributes("link");
      setLinkUrl(attrs.href || "");

      // Show the input
      setShowLinkInput(true);
    }
  };

  const applyLink = () => {
    if (linkUrl) {
      // Add http:// if it's missing
      const href = linkUrl.match(/^https?:\/\//)
        ? linkUrl
        : `http://${linkUrl}`;
      editor.chain().focus().setLink({ href }).run();
    } else {
      // Remove the link if URL is empty
      editor.chain().focus().unsetLink().run();
    }
    setShowLinkInput(false);
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    setLinkUrl("");
    setShowLinkInput(false);
  };

  // Handle key events in the input
  const handleLinkKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyLink();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowLinkInput(false);
    }
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    // Close the link input if clicked outside
    const target = e.target as Element;
    if (!target.closest(".link-input-popup")) {
      setShowLinkInput(false);
    }
  };

  const MenuItems = [
    {
      icon: <LuHeading1 />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      icon: <LuHeading2 />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: <LuHeading3 />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      icon: <LuBold />,
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: <LuItalic />,
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      icon: <LuUnderline />,
      onClick: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      icon: <MdFormatListBulleted />,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: <MdCode />,
      onClick: toggleCodeBlock,
    },
    {
      icon: <MdLink />,
      onClick: openLinkMenu,
    },
  ];

  return (
    <div
      className="tiptap-wrapper"
      onClick={showLinkInput ? handleClickOutside : undefined}
    >
      <div className="overflow-y-auto tiptap-editor-container">
        <EditorContent className="w-full tiptap" editor={editor} />
      </div>

      <FloatingMenu editor={editor}>
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-md border-[1px] border-gray-100 shadow">
          {MenuItems.map((item, index) => (
            <div
              key={index}
              onClick={item.onClick}
              className="p-1 text-lg text-gray-800 rounded-md cursor-pointer hover:bg-gray-200"
            >
              {item.icon}
            </div>
          ))}
        </div>
      </FloatingMenu>

      <BubbleMenu editor={editor}>
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-md border-[1px] border-gray-100 shadow">
          {MenuItems.map((item, index) => (
            <div
              key={index}
              onClick={item.onClick}
              className="p-1 text-lg text-gray-800 rounded-md cursor-pointer hover:bg-gray-200"
            >
              {item.icon}
            </div>
          ))}
        </div>
      </BubbleMenu>

      {showLinkInput && (
        <div
          className="fixed z-50 p-1 bg-white border border-gray-200 rounded-md shadow link-input-popup"
          style={{
            top: linkPosition.top + "px",
            left: linkPosition.left + "px",
          }}
        >
          <div className="flex gap-1 ">
            <Input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={handleLinkKeyDown}
              placeholder="Enter URL..."
              className="flex-1 w-56 h-6 p-1 border-none rounded shadow-none focus:outline-none focus-visible:ring-0"
              autoFocus
            />
            <div className="h-6 w-[1px] bg-stone-300"></div>

            <button
              onClick={applyLink}
              className="px-1 py-1 text-sm text-gray-700 rounded hover:bg-gray-200"
            >
              <FaCheck />
            </button>
            <button
              onClick={() => setShowLinkInput(false)}
              className="px-1 py-1 text-sm text-gray-700 rounded hover:bg-gray-200"
            >
              <IoClose className="text-lg" />
            </button>
            <button
              onClick={() => {
                removeLink();
              }}
              className="px-1 py-1 text-sm text-gray-700 rounded hover:bg-gray-200"
            >
              <IoMdTrash />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tiptap;
