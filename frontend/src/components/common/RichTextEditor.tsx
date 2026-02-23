import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  BoldOutlined,
  ItalicOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const ToolbarButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}> = ({ active, onClick, icon, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      border: '1px solid transparent',
      borderRadius: 4,
      cursor: 'pointer',
      fontSize: 14,
      backgroundColor: active ? '#e6f4ff' : 'transparent',
      color: active ? '#1677ff' : '#666',
      borderColor: active ? '#91caff' : 'transparent',
    }}
  >
    {icon}
  </button>
);

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        code: false,
        strike: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || '',
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.isEmpty ? '' : ed.getHTML());
    },
  });

  // 同步外部值变化（如 form.setFieldsValue）
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    const incoming = value ?? '';
    if (incoming !== current) {
      editor.commands.setContent(incoming, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      className="rich-text-editor"
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        overflow: 'hidden',
        transition: 'border-color 0.3s',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '4px 8px',
          borderBottom: '1px solid #d9d9d9',
          backgroundColor: '#fafafa',
        }}
      >
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={<BoldOutlined />}
          title="Bold"
        />
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={<ItalicOutlined />}
          title="Italic"
        />
        <div style={{ width: 1, height: 16, backgroundColor: '#d9d9d9', margin: '0 4px' }} />
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon={<UnorderedListOutlined />}
          title="Bullet List"
        />
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          icon={<OrderedListOutlined />}
          title="Ordered List"
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
