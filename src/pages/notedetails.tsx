import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import {
  allNotesAtom,
  loadingAtom,
  errorAtom,
  updateNoteAtom,
  deleteNoteAtom,
} from "../state/notes";
import { useAuthService } from "../services/authServices";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";
import type { NoteInput } from "../state/notes";
import axios from "axios";
import { useOnlineStatus } from "../utils/onlineStatus";
import jsPDF from "jspdf";

interface NoteData {
  id: number;
  title: string;
  content: string;
  format: string;
  color?: string;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  localId?: string;
  synced?: boolean;
}

const NoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isLocalId = id && id.startsWith("local-");
  const noteId = isLocalId ? undefined : parseInt(id || "0");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#ffffff");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [note, setNote] = useState<NoteData | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting] = useState(false);
  const isOnline = useOnlineStatus();

  const [allNotes] = useAtom(allNotesAtom);
  const [loading] = useAtom(loadingAtom);
  const [error] = useAtom(errorAtom);
  const [, updateNote] = useAtom(updateNoteAtom);
  const [, deleteNote] = useAtom(deleteNoteAtom);

  const { logout } = useAuthService();
  const navigate = useNavigate();

  const fetchNote = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setLocalError(null);

    try {
      const localNote = allNotes.find((n) =>
        isLocalId ? n.localId === id : n.id === noteId
      );

      if (localNote) {
        setNote(localNote);
        setTitle(localNote.title);
        setContent(localNote.content);
        setColor(localNote.color || "#ffffff");
        setIsLoading(false);
        return;
      }

      if (!isLocalId && noteId && isOnline) {
        const response = await axios.get(
          `https://n8wks000s84gsw8go4cggckk.softver.cc/api/notes/${noteId}`
        );

        const data = response.data;

        if (data.success) {
          const serverNote = {
            ...data.data,
            synced: true,
          };
          setNote(serverNote);
          setTitle(serverNote.title);
          setContent(serverNote.content);
          setColor(serverNote.color || "#ffffff");
        } else {
          setLocalError(data.message || "Failed to fetch note");
        }
      } else if (!isLocalId && !isOnline) {
        setLocalError("Cannot fetch note from server while offline");
      } else if (isLocalId && !localNote) {
        setLocalError("Local note not found");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch note";
      setLocalError(errorMessage);

      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout();
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, id, isLocalId, isOnline, allNotes]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  useEffect(() => {
    if (note) {
      const updatedNote = allNotes.find((n) =>
        isLocalId ? n.localId === id : n.id === noteId
      );

      if (updatedNote && JSON.stringify(updatedNote) !== JSON.stringify(note)) {
        setNote(updatedNote);
        if (!isEditing) {
          setTitle(updatedNote.title);
          setContent(updatedNote.content);
          setColor(updatedNote.color || "#ffffff");
        }
      }
    }
  }, [allNotes, note, isLocalId, id, noteId, isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById("export-menu");
      if (
        menu &&
        !menu.contains(event.target as Node) &&
        !(event.target as Element)
          .closest("button")
          ?.textContent?.includes("Export")
      ) {
        menu.classList.add("hidden");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #pdf-content, #pdf-content * {
          visibility: visible;
        }
        #pdf-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleSave = async () => {
    if (!id) return;

    setIsSaving(true);
    setLocalError(null);

    const noteData: Partial<NoteInput> = {
      title,
      content,
      color,
    };

    try {
      let result;
      if (isLocalId) {
        result = await updateNote({ localId: id, noteData });
      } else {
        result = await updateNote({ id: noteId, noteData });
      }

      if (result.success) {
        setNote(result.note);
        setIsEditing(false);
      } else if (result.error) {
        setLocalError(result.error);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update note";
      setLocalError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      let result;
      if (isLocalId) {
        result = await deleteNote({ localId: id });
      } else {
        result = await deleteNote({ id: noteId });
      }

      if (result.success) {
        navigate("/notes");
      } else if (result.error) {
        setLocalError(result.error);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete note";
      setLocalError(errorMessage);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const exportAsPDF = () => {
    const markdownContainer = document.getElementById("markdown-container");
    if (!markdownContainer) return;

    const actionButtons = document.getElementById("action-buttons");
    if (actionButtons) actionButtons.style.display = "none";

    const doc = new jsPDF("p", "pt", "a4");

    doc.html(markdownContainer, {
      callback: () => {
        doc.save(
          `${note?.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
        );
        if (actionButtons) actionButtons.style.display = "flex";
      },
      x: 20,
      y: 20,
      html2canvas: { scale: 0.5, useCORS: true },
      autoPaging: true,
      width: 555,
    });
  };
  const exportAsMarkdown = () => {
    if (!note) return;

    try {
      const blob = new Blob([note.content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting markdown:", error);
      setLocalError("Failed to export as Markdown. Please try again.");
    }
  };

  if ((loading || isLoading) && !note) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const displayError = error || localError;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {!isOnline && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              You are working in offline mode. Changes will sync when you're
              back online.
            </span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div
            className="flex justify-between items-center mb-6"
            id="action-buttons"
          >
            <button
              onClick={() => navigate("/notes")}
              className="text-gray-600 hover:text-gray-800"
            >
              &larr; Back to Notes
            </button>
            <div className="space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </>
              ) : (
                <>
                  <div className="relative inline-block text-left mr-2">
                    <button
                      onClick={() => {
                        const menu = document.getElementById("export-menu");
                        if (menu) menu.classList.toggle("hidden");
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded inline-flex items-center"
                      disabled={isExporting}
                    >
                      {isExporting ? "Exporting..." : "Export"}
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <div
                      id="export-menu"
                      className="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => {
                            document
                              .getElementById("export-menu")
                              ?.classList.add("hidden");
                            exportAsPDF();
                          }}
                          className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          disabled={isExporting}
                        >
                          Export as PDF
                        </button>
                        <button
                          onClick={() => {
                            document
                              .getElementById("export-menu")
                              ?.classList.add("hidden");
                            exportAsMarkdown();
                          }}
                          className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          disabled={isExporting}
                        >
                          Export as Markdown
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {displayError && (
            <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
              {displayError}
            </div>
          )}

          {note && (
            <div>
              {isEditing ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">
                      Content (Markdown)
                    </label>
                    <div data-color-mode="light">
                      <MDEditor
                        value={content}
                        onChange={(val) => setContent(val || "")}
                        height={400}
                        preview="edit"
                        previewOptions={{
                          rehypePlugins: [[rehypeSanitize]],
                        }}
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">
                      Note Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-10 h-10 border rounded-md"
                      />
                      <span className="text-sm text-gray-500">
                        Choose a background color for your note
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-4">
                    {!note.synced && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-yellow-500 animate-pulse"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <h1 className="text-3xl font-bold">{note.title}</h1>
                  </div>
                  <div className="text-sm text-gray-500 mb-6">
                    <span>Created: {formatDate(note.createdAt)}</span>
                    {note.updatedAt !== note.createdAt && (
                      <span className="ml-4">
                        Updated: {formatDate(note.updatedAt)}
                      </span>
                    )}
                    {!note.synced && (
                      <span className="ml-4 text-yellow-600 font-medium">
                        Not synced
                      </span>
                    )}
                  </div>
                  <div className="p-6 rounded-lg">
                    <div
                      data-color-mode="light"
                      id="markdown-container"
                      className="prose max-w-none"
                    >
                      <MDEditor.Markdown
                        source={note.content}
                        rehypePlugins={[[rehypeSanitize]]}
                        className="prose max-w-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteDetailPage;
