"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useState, useRef, useEffect } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Bold, Italic, List, ListOrdered, Smile, Undo, Redo } from 'lucide-react';
import styles from '../mail.module.css';

export default function RichEditor({ onChange, initialContent = "" }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Écrivez votre message ici...' }),
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    // On peut injecter des classes directement ici pour être sûr
    editorProps: {
      attributes: {
        class: styles.tiptapEditorInside, 
      },
    },
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor) return null;

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorToolbar}>
        <div className={styles.toolbarGroup}>
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? styles.editorBtnActive : styles.editorBtn}><Bold size={18} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? styles.editorBtnActive : styles.editorBtn}><Italic size={18} /></button>
        </div>
        <div className={styles.toolbarDivider} />
        <div className={styles.toolbarGroup}>
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? styles.editorBtnActive : styles.editorBtn}><List size={18} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? styles.editorBtnActive : styles.editorBtn}><ListOrdered size={18} /></button>
        </div>
        <div className={styles.toolbarDivider} />
        <div className={styles.emojiWrapper} ref={emojiPickerRef}>
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={showEmojiPicker ? styles.editorBtnActive : styles.editorBtn}><Smile size={18} /></button>
          {showEmojiPicker && (
            <div className={styles.emojiPopover}>
              <EmojiPicker onEmojiClick={(d) => { editor.chain().focus().insertContent(d.emoji).run(); setShowEmojiPicker(false); }} theme={Theme.DARK} width={300} height={400} />
            </div>
          )}
        </div>
      </div>

      <EditorContent editor={editor} className={styles.editorContentArea} />
    </div>
  );
}