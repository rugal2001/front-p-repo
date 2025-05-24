import {
  BubbleMenu,
  Editor,
  EditorContent,
  FloatingMenu,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
} from "@tiptap/react";
import { IoMdTrash } from "react-icons/io";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Gapcursor from "@tiptap/extension-gapcursor";

import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";

import Italic from "@tiptap/extension-italic";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { Node as ProseMirrorNode } from "prosemirror-model";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaCheck, FaYoutube } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import {
  AiOutlineInsertRowAbove,
  AiOutlineInsertRowRight,
  AiOutlineInsertRowBelow,
  AiOutlineInsertRowLeft,
} from "react-icons/ai";
import {
  LuBold,
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuItalic,
  LuUnderline,
  LuMinus,
  LuSeparatorHorizontal,
  LuTableCellsMerge,
  LuTableCellsSplit,
} from "react-icons/lu";
import { PiColumnsPlusLeft, PiColumnsPlusRight, PiVideo } from "react-icons/pi";
import { RxHamburgerMenu } from "react-icons/rx";
import { MdCode, MdFormatListBulleted, MdImage, MdLink } from "react-icons/md";
import { FiImage } from "react-icons/fi";
import { BiDockLeft, BiDockRight, BiTable } from "react-icons/bi";
import { BsThreeDotsVertical, BsPlus } from "react-icons/bs";
import { HiOutlineDotsHorizontal, HiOutlineTrash } from "react-icons/hi";
import {
  TbGripVertical,
  TbGripHorizontal,
  TbColumnRemove,
  TbRowRemove,
} from "react-icons/tb";

// Import additional languages for syntax highlighting
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { Input } from "./shadcn/input";
import Placeholder from "@tiptap/extension-placeholder";
import { Node, mergeAttributes } from "@tiptap/core";
import { Tooltip, TooltipContent, TooltipTrigger } from "./shadcn/tooltip";

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

// Custom resizable image component
interface ResizableImageProps {
  node: ProseMirrorNode;
  updateAttributes: (attrs: { [key: string]: any }) => void;
  editor: Editor;
}

const ResizableImageComponent: React.FC<ResizableImageProps> = ({
  node,
  updateAttributes,
  editor,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [initialWidth, setInitialWidth] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);
  const [initialX, setInitialX] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);

  // Set initial dimensions when component mounts
  useEffect(() => {
    if (imageRef.current) {
      // If image doesn't have width/height attributes yet, set them from the natural dimensions
      if (!node.attrs.width || !node.attrs.height) {
        const img = imageRef.current;
        // Use onload to ensure dimensions are available
        if (img.complete) {
          updateAttributes({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        } else {
          img.onload = () => {
            updateAttributes({
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
          };
        }
      }
    }
  }, [node.attrs.src]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!imageRef.current) return;

    setIsResizing(true);
    setInitialWidth(imageRef.current.offsetWidth);
    setInitialHeight(imageRef.current.offsetHeight);
    setInitialX(e.clientX);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !imageRef.current) return;

      const widthChange = e.clientX - initialX;
      const newWidth = Math.max(100, initialWidth + widthChange); // Minimum width of 100px

      // Apply aspect ratio to maintain proportions
      const aspectRatio = initialWidth / initialHeight;
      const newHeight = Math.round(newWidth / aspectRatio);

      updateAttributes({
        width: newWidth,
        height: newHeight,
      });
    },
    [isResizing, initialWidth, initialHeight, initialX, updateAttributes]
  );

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add and remove event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", stopResizing);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, handleMouseMove, stopResizing]);

  return (
    <NodeViewWrapper>
      <div
        className="resizable-image-wrapper group"
        style={{
          position: "relative",
          display: "inline-block",
          margin: "0.5rem 0",
        }}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          width={node.attrs.width || undefined}
          height={node.attrs.height || undefined}
          className="rounded-lg shadow border-[1px] border-gray-200"
          draggable={false}
          style={{ display: "block" }}
        />
        {editor.isEditable && (
          <>
            <div
              onMouseDown={startResizing}
              className={`absolute top-1/2 left-0 w-2 h-12  -translate-y-1/2 bg-white opacity-0 group-hover:opacity-100 rounded-full ml-1 shadow-lg border border-gray-200 ${
                isResizing ? " cursor-col-resize" : " cursor-col-resize"
              }`}
            />
            <div
              onMouseDown={startResizing}
              className={`absolute top-1/2 right-0 w-2 h-12  -translate-y-1/2 bg-white opacity-0 group-hover:opacity-100 rounded-full mr-1 shadow-lg border border-gray-200 ${
                isResizing ? " cursor-col-resize" : " cursor-col-resize"
              }`}
            />
          </>
        )}
        {isResizing && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              cursor: "col-resize",
            }}
          />
        )}
        {isResizing && (
          <div
            className="absolute px-2 py-1 text-xs text-white bg-black bg-opacity-75 rounded top-2 left-2"
            style={{ zIndex: 101 }}
          >
            {node.attrs.width} × {node.attrs.height}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// Define custom image extension with resizing capability
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
  addCommands() {
    return {
      ...this.parent?.(),
      // Override setImage command to include width and height
      setImage:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attrs,
          });
        },
    };
  },
});

// Custom resizable video component
interface ResizableVideoProps {
  node: ProseMirrorNode;
  updateAttributes: (attrs: { [key: string]: any }) => void;
  editor: Editor;
}

const ResizableVideoComponent: React.FC<ResizableVideoProps> = ({
  node,
  updateAttributes,
  editor,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [initialWidth, setInitialWidth] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);
  const [initialX, setInitialX] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Set initial dimensions when component mounts
  useEffect(() => {
    if (videoRef.current) {
      // If video doesn't have width/height attributes yet, set them from the natural dimensions
      if (!node.attrs.width || !node.attrs.height) {
        const video = videoRef.current;
        video.onloadedmetadata = () => {
          updateAttributes({
            width: video.videoWidth || 640,
            height: video.videoHeight || 360,
          });
        };
      }
    }
  }, [node.attrs.src]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!videoRef.current) return;

    setIsResizing(true);
    setInitialWidth(videoRef.current.offsetWidth);
    setInitialHeight(videoRef.current.offsetHeight);
    setInitialX(e.clientX);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !videoRef.current) return;

      const widthChange = e.clientX - initialX;
      const newWidth = Math.max(200, initialWidth + widthChange); // Minimum width of 200px

      // Apply aspect ratio to maintain proportions
      const aspectRatio = initialWidth / initialHeight;
      const newHeight = Math.round(newWidth / aspectRatio);

      updateAttributes({
        width: newWidth,
        height: newHeight,
      });
    },
    [isResizing, initialWidth, initialHeight, initialX, updateAttributes]
  );

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add and remove event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", stopResizing);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, handleMouseMove, stopResizing]);

  return (
    <NodeViewWrapper>
      <div
        className="relative resizable-video-wrapper group"
        style={{
          display: "block",
          margin: "1rem 0",
          textAlign: "center",
        }}
      >
        <video
          ref={videoRef}
          src={node.attrs.src}
          width={node.attrs.width || 640}
          height={node.attrs.height || 360}
          controls
          className="rounded-lg shadow border-[1px] border-gray-200"
          style={{ display: "inline-block", maxWidth: "100%" }}
        />
        {editor.isEditable && (
          <>
            <div
              onMouseDown={startResizing}
              className={`absolute top-1/2 left-0 w-2 h-12  -translate-y-1/2 bg-white opacity-0 group-hover:opacity-100 rounded-full ml-1 shadow-lg border border-gray-200 ${
                isResizing ? " cursor-col-resize" : " cursor-col-resize"
              }`}
            />
            <div
              onMouseDown={startResizing}
              className={`absolute top-1/2 right-0 w-2 h-12  -translate-y-1/2 bg-white opacity-0 group-hover:opacity-100 rounded-full mr-1 shadow-lg border border-gray-200 ${
                isResizing ? " cursor-col-resize" : " cursor-col-resize"
              }`}
            />
          </>
        )}
        {isResizing && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              cursor: "col-resize",
            }}
          />
        )}
        {isResizing && (
          <div
            className="absolute px-2 py-1 text-xs text-white bg-black bg-opacity-75 rounded top-2 left-2"
            style={{ zIndex: 101 }}
          >
            {node.attrs.width} × {node.attrs.height}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// Custom resizable YouTube component
interface ResizableYoutubeProps {
  node: ProseMirrorNode;
  updateAttributes: (attrs: { [key: string]: any }) => void;
  editor: Editor;
}

const ResizableYoutubeComponent: React.FC<ResizableYoutubeProps> = ({
  node,
  updateAttributes,
  editor,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [initialWidth, setInitialWidth] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);
  const [initialX, setInitialX] = useState(0);
  const [resizeDirection, setResizeDirection] = useState<"left" | "right">(
    "right"
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Convert YouTube URL to embed format
  const getEmbedUrl = (url: string) => {
    if (!url) return "";

    // If it's already an embed URL, return it
    if (url.includes("youtube.com/embed/")) {
      return url;
    }

    // Extract video ID from various YouTube URL formats
    const videoIdMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    );
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
    }

    return url; // Return original if no match found
  };

  // Set initial dimensions when component mounts
  useEffect(() => {
    if (!node.attrs.width || !node.attrs.height) {
      updateAttributes({
        width: 640,
        height: 480,
      });
    }
  }, [node.attrs.src]);

  const startResizing = (e: React.MouseEvent, direction: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();

    if (!iframeRef.current) return;

    setIsResizing(true);
    setResizeDirection(direction);
    setInitialWidth(iframeRef.current.offsetWidth);
    setInitialHeight(iframeRef.current.offsetHeight);
    setInitialX(e.clientX);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !iframeRef.current) return;

      const widthChange = e.clientX - initialX;
      let newWidth;

      if (resizeDirection === "right") {
        newWidth = Math.max(320, initialWidth + widthChange);
      } else {
        newWidth = Math.max(320, initialWidth - widthChange);
      }

      // YouTube maintains 16:9 aspect ratio
      const aspectRatio = 16 / 9;
      const newHeight = Math.round(newWidth / aspectRatio);

      updateAttributes({
        width: newWidth,
        height: newHeight,
      });
    },
    [
      isResizing,
      initialWidth,
      initialHeight,
      initialX,
      resizeDirection,
      updateAttributes,
    ]
  );

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add and remove event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", stopResizing);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, handleMouseMove, stopResizing]);

  const embedUrl = getEmbedUrl(node.attrs.src);

  return (
    <NodeViewWrapper>
      <div
        className="relative resizable-youtube-wrapper group"
        style={{
          display: "block",
          margin: "1rem 0",
          textAlign: "center",
        }}
      >
        <iframe
          ref={iframeRef}
          src={embedUrl}
          width={node.attrs.width || 640}
          height={node.attrs.height || 480}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="rounded-lg shadow border-[1px] border-gray-200"
          style={{
            display: "inline-block",
            width: `${node.attrs.width || 640}px`,
            height: `${node.attrs.height || 480}px`,
            maxWidth: "100%",
          }}
          frameBorder="0"
        />
        {editor.isEditable && (
          <>
            <div
              onMouseDown={(e) => startResizing(e, "left")}
              className={`absolute top-1/2 left-0 w-3 h-16 -translate-y-1/2 bg-white opacity-0 group-hover:opacity-70 hover:opacity-90 rounded-full -ml-1 shadow-lg border border-gray-300 cursor-col-resize transition-opacity duration-200 `}
              style={{ zIndex: 10 }}
            />
            <div
              onMouseDown={(e) => startResizing(e, "right")}
              className={`absolute top-1/2 right-0 w-3 h-16 -translate-y-1/2 bg-white opacity-0 group-hover:opacity-70 hover:opacity-90 rounded-full -mr-1 shadow-lg border border-gray-300 cursor-col-resize transition-opacity duration-200`}
              style={{ zIndex: 10 }}
            />
          </>
        )}
        {isResizing && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              cursor: "col-resize",
            }}
          />
        )}
        {isResizing && (
          <div
            className="absolute px-3 py-2 text-sm text-white bg-black rounded-lg bg-opacity-80 top-4 left-4"
            style={{ zIndex: 101 }}
          >
            {node.attrs.width} × {node.attrs.height}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// Define custom YouTube extension with resizing capability
const ResizableYoutube = Youtube.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 640,
      },
      height: {
        default: 480,
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableYoutubeComponent);
  },
});

const Video = Node.create({
  name: "video",

  group: "block",
  inline: false,
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "video",
      },
    ];
  },

  renderHTML({ node }) {
    return ["video", mergeAttributes({ controls: true }, node.attrs)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableVideoComponent);
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
  Gapcursor,
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: "tiptap-table",
    },
  }),
  TableRow,
  TableHeader.configure({
    HTMLAttributes: {
      class: "tiptap-table-header",
    },
  }),
  TableCell.configure({
    HTMLAttributes: {
      class: "tiptap-table-cell",
    },
  }),
  Placeholder.configure({
    // Use a placeholder:
    placeholder: "Write something …",
    // Use different placeholders depending on the node type:
    // placeholder: ({ node }) => {
    //   if (node.type.name === 'heading') {
    //     return 'What's the title?'
    //   }

    //   return 'Can you add some further context?'
    // },
  }),
  HorizontalRule.configure({
    HTMLAttributes: {
      class: "horizontal-rule",
    },
  }),
  ResizableImage.configure({
    HTMLAttributes: {
      class: "rounded-lg shadow border-[1px] border-gray-400",
    },
    allowBase64: true,
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
  ResizableYoutube.configure({
    controls: true,
    nocookie: false,
    allowFullscreen: true,
    width: 640,
    height: 480,
    HTMLAttributes: {
      class: "rounded-lg shadow border-[1px] border-gray-400 mt-2",
    },
  }),
  Video,
];

const content = `
<h1>Heading 1</h1>
<img src="https://giffiles.alphacoders.com/208/208014.gif" width="800" height="400" />

<h2>Sample Table</h2>
<table class="tiptap-table">
  <tbody>
    <tr>
      <th class="tiptap-table-header">Name</th>
      <th class="tiptap-table-header">Role</th>
      <th class="tiptap-table-header">Experience</th>
    </tr>
    <tr>
      <td class="tiptap-table-cell">John Doe</td>
      <td class="tiptap-table-cell">Developer</td>
      <td class="tiptap-table-cell">5 years</td>
    </tr>
    <tr>
      <td class="tiptap-table-cell">Jane Smith</td>
      <td class="tiptap-table-cell">Designer</td>
      <td class="tiptap-table-cell">3 years</td>
    </tr>
  </tbody>
</table>

<h2>Sample Video (Resizable)</h2>
<video src="https://www.w3schools.com/html/mov_bbb.mp4" width="640" height="360" controls></video>

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
<h1>Heading 1</h1>
`;

const Tiptap = () => {
  // Simple state to track if we're showing the link input
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkPosition, setLinkPosition] = useState({ top: 0, left: 0 });
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePosition, setImagePosition] = useState({ top: 0, left: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPosition, setVideoPosition] = useState({ top: 0, left: 0 });
  const [height, setHeight] = useState("480");
  const [width, setWidth] = useState("640");

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

      /* Video wrapper styles */
      .resizable-video-wrapper {
        margin: 1rem 0;
        text-align: center;
        width: auto;
      }
      
      .resizable-video-wrapper video {
        max-width: 100%;
        height: auto;
        transition: opacity 0.2s ease;
      }
      
      .resizable-video-wrapper:hover video {
        opacity: 0.9;
      }
      
      /* Video selection styles */
      .ProseMirror video.is-editor-selected {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }

      /* Video resize handles */
      .resizable-video-wrapper .group:hover .opacity-0 {
        opacity: 1;
        transition: opacity 0.2s ease;
      }
      
      /* Improved video wrapper selection */
      .resizable-video-wrapper.ProseMirror-selectednode {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
        border-radius: 8px;
      }

      /* YouTube wrapper styles */
      .resizable-youtube-wrapper {
        margin: 1rem 0;
        text-align: center;
        width: auto;
      }
      
      .resizable-youtube-wrapper iframe {
        max-width: 100%;
        transition: opacity 0.2s ease;
      }
      
      .resizable-youtube-wrapper:hover iframe {
        opacity: 0.9;
      }
      
      /* YouTube selection styles */
      .ProseMirror iframe.is-editor-selected {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }

      /* YouTube resize handles */
      .resizable-youtube-wrapper .group:hover .opacity-0 {
        opacity: 1;
        transition: opacity 0.2s ease;
      }
      
      /* Improved YouTube wrapper selection */
      .resizable-youtube-wrapper.ProseMirror-selectednode {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
        border-radius: 8px;
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

  // Add image handling functions
  const openImageMenu = () => {
    // Get current selection position
    const { view } = editor;
    if (view && view.state) {
      const { from } = view.state.selection;
      const coords = view.coordsAtPos(from);

      // Set position for popup
      setImagePosition({
        top: coords.bottom + 10,
        left: coords.left,
      });

      // Show the input
      setShowImageInput(true);
    }
  };

  const insertImage = () => {
    if (imageUrl) {
      // Create a temporary image to get natural dimensions
      const tempImg = document.createElement("img");
      tempImg.onload = () => {
        // Insert with natural dimensions from the loaded image
        editor
          .chain()
          .focus()
          .insertContent({
            type: "image",
            attrs: {
              src: imageUrl,
              width: tempImg.naturalWidth,
              height: tempImg.naturalHeight,
            },
          })
          .run();
        setImageUrl("");
        setShowImageInput(false);
      };
      tempImg.onerror = () => {
        // If image fails to load, insert with default dimensions
        editor
          .chain()
          .focus()
          .insertContent({
            type: "image",
            attrs: {
              src: imageUrl,
              width: 500,
              height: 300,
            },
          })
          .run();
        setImageUrl("");
        setShowImageInput(false);
      };
      tempImg.src = imageUrl;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;

        // Create a temporary image to get natural dimensions
        const tempImg = document.createElement("img");
        tempImg.onload = () => {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "image",
              attrs: {
                src: result,
                width: tempImg.naturalWidth,
                height: tempImg.naturalHeight,
              },
            })
            .run();

          // Reset the input value so the same file can be selected again if needed
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        };
        tempImg.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;

        // Create a temporary video element to get natural dimensions
        const tempVideo = document.createElement("video");
        tempVideo.onloadedmetadata = () => {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "video",
              attrs: {
                src: result,
                width: tempVideo.videoWidth || 640,
                height: tempVideo.videoHeight || 360,
              },
            })
            .run();

          // Reset the input value so the same file can be selected again if needed
          if (videoFileInputRef.current) {
            videoFileInputRef.current.value = "";
          }

          // Close the video input popup
          setShowVideoInput(false);
          setVideoUrl("");
        };
        tempVideo.onerror = () => {
          // If video fails to load metadata, insert with default dimensions
          editor
            .chain()
            .focus()
            .insertContent({
              type: "video",
              attrs: {
                src: result,
                width: 640,
                height: 360,
              },
            })
            .run();

          // Reset the input and close popup
          if (videoFileInputRef.current) {
            videoFileInputRef.current.value = "";
          }
          setShowVideoInput(false);
          setVideoUrl("");
        };
        tempVideo.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClickOutsideImage = (e: React.MouseEvent) => {
    // Close the image input if clicked outside
    const target = e.target as Element;
    if (!target.closest(".image-input-popup")) {
      setShowImageInput(false);
    }
  };

  const handleImageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      insertImage();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowImageInput(false);
    }
  };

  const openVideoMenu = () => {
    // Get current selection position
    const { view } = editor;
    if (view && view.state) {
      const { from } = view.state.selection;
      const coords = view.coordsAtPos(from);

      // Set position for popup
      setVideoPosition({
        top: coords.bottom + 10,
        left: coords.left,
      });

      // Show the input
      setShowVideoInput(true);
    }
  };

  const insertVideo = () => {
    if (videoUrl) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "video",
          attrs: {
            src: videoUrl,
            width: 640, // Default width
            height: 360, // Default height
          },
        })
        .run();
      setVideoUrl("");
      setShowVideoInput(false);
    }
  };

  const addYoutubeVideo = () => {
    const url = prompt("Enter YouTube URL");

    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: Math.max(320, parseInt(width, 10)) || 640,
        height: Math.max(180, parseInt(height, 10)) || 480,
      });
    }
  };

  const MenuItems = [
    {
      icon: <LuHeading1 />,
      label: "Heading 1",
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive("heading", { level: 1 }),
    },
    {
      icon: <LuHeading2 />,
      label: "Heading 2",
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive("heading", { level: 2 }),
    },
    {
      icon: <LuHeading3 />,
      label: "Heading 3",
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive("heading", { level: 3 }),
    },
    {
      icon: null,
      label: "DEVIDER",
      function: "DEVIDER",
      onClick: () => void 0,
      isActive: () => false,
    },
    {
      icon: <LuBold />,
      label: "Bold",
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive("bold"),
    },
    {
      icon: <LuItalic />,
      label: "Italic",
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive("italic"),
    },
    {
      icon: <LuUnderline />,
      label: "Underline",
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive("underline"),
    },
    {
      icon: null,
      label: "DEVIDER",
      function: "DEVIDER",
      onClick: () => void 0,
      isActive: () => false,
    },
    {
      icon: <LuSeparatorHorizontal />,
      label: "Horizontal Rule",
      onClick: () => editor.chain().focus().setHorizontalRule().run(),
      isActive: () => false, // Horizontal rule doesn't have an active state
    },
    {
      icon: <MdFormatListBulleted />,
      label: "Bullet List",
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive("bulletList"),
    },
    {
      icon: <MdCode />,
      label: "Code Block",
      onClick: toggleCodeBlock,
      isActive: () => editor.isActive("codeBlock"),
    },
    {
      icon: <MdLink />,
      label: "Link",
      onClick: openLinkMenu,
      isActive: () => editor.isActive("link"),
    },
    {
      icon: <BiTable />,
      label: "Table",
      onClick: () =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
      isActive: () => editor.isActive("table"),
    },
    {
      icon: null,
      label: "DEVIDER",
      function: "DEVIDER",
      onClick: () => void 0,
      isActive: () => false,
    },
    {
      icon: <FiImage />,
      label: "Image",
      onClick: openImageMenu,
      isActive: () => false, // Image insertion doesn't have an active state
    },
    {
      icon: <PiVideo />,
      label: "Video",
      onClick: openVideoMenu,
      isActive: () => false, // Video insertion doesn't have an active state
    },
    {
      icon: <FaYoutube />,
      label: "Youtube",
      color: "red",
      onClick: addYoutubeVideo,
      isActive: () => false, // Video insertion doesn't have an active state
    },
  ];

  const handleVideoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      insertVideo();
    }
  };

  const tableMenuItems = [
    {
      icon: <AiOutlineInsertRowLeft />,
      label: "Col Before",
      color: "blue",
      onClick: () => editor.chain().focus().addColumnBefore().run(),
    },
    {
      icon: <AiOutlineInsertRowRight />,
      label: "Col After",
      color: "blue",
      onClick: () => editor.chain().focus().addColumnAfter().run(),
    },
    {
      icon: <TbColumnRemove />,
      label: "Del Col",
      color: "red",
      onClick: () => editor.chain().focus().deleteColumn().run(),
    },
    {
      icon: null,
      label: "DEVIDER",
      function: "DEVIDER",
      onClick: () => void 0,
      isActive: () => false,
    },
    {
      icon: <AiOutlineInsertRowAbove />,
      label: "Row Before",
      color: "blue",
      onClick: () => editor.chain().focus().addRowBefore().run(),
    },
    {
      icon: <AiOutlineInsertRowBelow />,
      label: "Row After",
      color: "blue",
      onClick: () => editor.chain().focus().addRowAfter().run(),
    },
    {
      icon: <TbRowRemove />,
      label: "Del Row",
      color: "red",
      onClick: () => editor.chain().focus().deleteRow().run(),
    },
    {
      icon: null,
      label: "DEVIDER",
      function: "DEVIDER",
      onClick: () => void 0,
      isActive: () => false,
    },
    {
      icon: <LuTableCellsMerge />,
      label: "Merge",
      color: "purple",
      onClick: () => editor.chain().focus().mergeCells().run(),
    },
    {
      icon: <LuTableCellsSplit />,
      label: "Split",
      color: "purple",
      onClick: () => editor.chain().focus().splitCell().run(),
    },
    {
      icon: null,
      label: "DEVIDER",
      function: "DEVIDER",
      onClick: () => void 0,
      isActive: () => false,
    },
    {
      icon: <HiOutlineTrash />,
      label: "Delete Table",
      color: "red",
      onClick: () => editor.chain().focus().deleteTable().run(),
    },
  ];

  return (
    <div
      className="tiptap-wrapper"
      onClick={
        showLinkInput
          ? handleClickOutside
          : showImageInput
          ? handleClickOutsideImage
          : undefined
      }
    >
      {/* File input for image uploads (hidden but triggered via button) */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      {/* File input for video uploads (hidden but triggered via button) */}
      <input
        type="file"
        accept="video/*"
        ref={videoFileInputRef}
        style={{ display: "none" }}
        onChange={handleVideoFileUpload}
      />

      <div className="overflow-y-auto tiptap-editor-container">
        <EditorContent className="w-full tiptap" editor={editor} />
      </div>

      {/* Modern Floating Menu */}
      <FloatingMenu
        editor={editor}
        tippyOptions={{
          placement: "top-start",
        }}
      >
        <div className="flex flex-col items-center gap-0.5 bg-white p-0.5 rounded-md border-[1px] border-gray-100 shadow h-60 w-48 overflow-y-auto">
          {MenuItems.map((item, index) => (
            <>
              {item.function === "DEVIDER" ? (
                <div className="w-full h-2  bg-gray-200 my-1 border-b-[1px] border-gray-200 "></div>
              ) : (
                <div
                  key={index}
                  onClick={item.onClick}
                  className={`p-1 text-lg rounded-md cursor-pointer flex gap-x-2 items-center  w-full ${
                    !!item.color ? `text-${item.color}-500` : ""
                  } ${
                    item.isActive() && !item.color
                      ? "bg-indigo-100 text-indigo-600"
                      : "text-gray-800 hover:bg-gray-200 hover:text-indigo-600"
                  }`}
                >
                  <div
                    className={`p-1 rounded-md  ${
                      !!item.color
                        ? `text-${item.color}-500 bg-${item.color}-50`
                        : "text-indigo-600 bg-indigo-50"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
              )}
            </>
          ))}
        </div>
      </FloatingMenu>

      <BubbleMenu editor={editor} className="max-w-none">
        <div
          className={`flex items-center gap-0.5 bg-white p-0.5 rounded-md border-[1px] border-gray-100 shadow ${
            editor.isActive("table") ? "" : "w-[410px]"
          }`}
        >
          {editor.isActive("table") ? (
            <>
              {tableMenuItems.map((item) => (
                <>
                  {item?.function === "DEVIDER" ? (
                    <div className="w-[1px] h-6 bg-gray-300 mx-1"></div>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger>
                        <button
                          onClick={item.onClick}
                          className={`px-2 py-1 transition-colors duration-200 rounded ${
                            item.color === "red"
                              ? "text-red-700 bg-red-50 hover:bg-red-100"
                              : item.color === "blue"
                              ? "text-blue-700 bg-blue-50 hover:bg-blue-100"
                              : item.color === "green"
                              ? "text-green-700 bg-green-50 hover:bg-green-100"
                              : "text-purple-700 bg-purple-50 hover:bg-purple-100"
                          }`}
                        >
                          {item.icon}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs text-white bg-black/50 ">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </>
              ))}
            </>
          ) : (
            // Regular menu items when not in a table
            MenuItems.map((item, index) => (
              <>
                {item.function === "DEVIDER" ? (
                  <div className="w-[1px] h-6  bg-gray-200 my-1 border-r-[1px] border-gray-200"></div>
                ) : (
                  <div
                    key={index}
                    onClick={item.onClick}
                    className={`p-1 text-lg rounded-md cursor-pointer 
                  ${!!item.color ? `text-${item.color}-500` : ""}
                  ${
                    item.isActive() && !item.color
                      ? "bg-indigo-100 text-indigo-600"
                      : "text-gray-800 hover:bg-gray-200"
                  }`}
                  >
                    {item.icon}
                  </div>
                )}
              </>
            ))
          )}
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

      {showImageInput && (
        <div
          className="fixed z-50 p-1 bg-white border border-gray-200 rounded-md shadow image-input-popup"
          style={{
            top: imagePosition.top + "px",
            left: imagePosition.left + "px",
          }}
        >
          <div className="flex gap-1">
            <Input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={handleImageKeyDown}
              placeholder="Enter image URL..."
              className="flex-1 w-64 h-6 p-1 border-none rounded shadow-none focus:outline-none focus-visible:ring-0"
              autoFocus
            />
            <div className="h-6 w-[1px] bg-stone-300"></div>
            <button
              onClick={insertImage}
              className="px-1 py-1 text-sm text-gray-700 rounded hover:bg-gray-200"
            >
              <FaCheck />
            </button>
            <button
              onClick={() => setShowImageInput(false)}
              className="px-1 py-1 text-sm text-gray-700 rounded hover:bg-gray-200"
            >
              <IoClose className="text-lg" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-1 py-1 text-sm text-gray-700 rounded hover:bg-gray-200"
            >
              <FiImage />
            </button>
          </div>
        </div>
      )}

      {showVideoInput && (
        <div
          className="fixed z-50 p-1 bg-white border border-gray-200 rounded-md shadow image-input-popup"
          style={{
            top: videoPosition.top + "px",
            left: videoPosition.left + "px",
          }}
        >
          <div className="flex gap-1">
            <Input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={handleVideoKeyDown}
              placeholder="Enter video URL..."
              className="flex-1 w-64 h-6 p-1 border-none rounded shadow-none focus:outline-none focus-visible:ring-0"
              autoFocus
            />
            <div className="h-6 w-[1px] bg-stone-300"></div>
            <button
              onClick={insertVideo}
              className="px-1 py-1 text-sm text-gray-700 rounded hover:bg-gray-200"
            >
              <FaCheck />
            </button>
            <button
              onClick={() => setShowVideoInput(false)}
              className="px-1 py-1 text-sm text-gray-700 rounded hover:bg-gray-200"
            >
              <IoClose className="text-lg" />
            </button>
            <button
              onClick={() => videoFileInputRef.current?.click()}
              className="px-1 py-1 text-sm text-gray-700 rounded hover:bg-gray-200"
              title="Upload video file"
            >
              <PiVideo />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tiptap;
