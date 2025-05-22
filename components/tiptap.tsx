import {
  useEditor,
  EditorContent,
  FloatingMenu,
  BubbleMenu,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { MdCode, MdFormatListBulleted, MdFormatQuote } from "react-icons/md";
import { useState, useEffect } from "react";

// Import additional languages for syntax highlighting
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";

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
];

const content = `
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

  const toggleCodeBlock = () => {
    editor.chain().focus().toggleCodeBlock().run();
  };

  const MenuItems = [
    {
      icon: <MdFormatListBulleted />,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },

    {
      icon: <MdCode />,
      onClick: toggleCodeBlock,
    },
  ];

  return (
    <div className="tiptap-wrapper">
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
    </div>
  );
};

export default Tiptap;
