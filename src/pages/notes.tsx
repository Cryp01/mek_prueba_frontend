import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import {
  allNotesAtom,
  loadingAtom,
  errorAtom,
  fetchNotesAtom,
  createNoteAtom,
  syncOfflineChangesAtom,
  pendingUpdatesAtom,
  offlineNotesAtom,
} from "../state/notes";
import { useAuthService } from "../services/authServices";
import type { NoteInput } from "../state/notes";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";
import { useOnlineStatus } from "../utils/onlineStatus";

const NotesPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#F8F9FA");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isOnline = useOnlineStatus();

  const [allNotes] = useAtom(allNotesAtom);
  const [offlineNotes] = useAtom(offlineNotesAtom);
  const [loading] = useAtom(loadingAtom);
  const [error] = useAtom(errorAtom);
  const [pendingUpdates] = useAtom(pendingUpdatesAtom);
  const [, fetchNotes] = useAtom(fetchNotesAtom);
  const [, createNote] = useAtom(createNoteAtom);
  const [, syncOfflineChanges] = useAtom(syncOfflineChangesAtom);

  const { logout } = useAuthService();
  const navigate = useNavigate();

  const loadNotes = useCallback(async () => {
    try {
      await fetchNotes();
    } catch (error) {
      console.error("Error fetching notes:", error);
      // Only logout if we're not offline
      if (navigator.onLine) {
        logout();
        navigate("/login");
      }
    }
  }, [fetchNotes, logout, navigate]);

  useEffect(() => {
    if (!isInitialized) {
      loadNotes();
      setIsInitialized(true);
    }
  }, [isInitialized, loadNotes]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();

    const noteData: NoteInput = {
      title,
      content,
      format: "markdown",
      color,
    };

    const result = await createNote(noteData);

    if (result.success) {
      setShowCreateModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setColor("#F8F9FA");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  useEffect(() => {
    const sync = async () => {
      if (navigator.onLine && pendingUpdates.length > 0) {
        await handleSyncNow();
      }
    };

    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingUpdates]);

  // Manual synchronization
  const handleSyncNow = async () => {
    if (navigator.onLine && !isSyncing) {
      setIsSyncing(true);
      try {
        await syncOfflineChanges();
      } catch (error) {
        console.error("Error syncing:", error);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Pending changes counter
  const pendingChangesCount = pendingUpdates.length;
  const offlineNotesCount = offlineNotes.length;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">My Notes</h1>
            <div className="space-x-2 flex items-center">
              {pendingChangesCount > 0 && (
                <button
                  onClick={handleSyncNow}
                  disabled={!isOnline || isSyncing}
                  className={`flex items-center ${
                    isOnline && !isSyncing
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-gray-400 cursor-not-allowed"
                  } text-white font-medium py-2 px-4 rounded`}
                >
                  {isSyncing ? (
                    <svg
                      className="animate-spin h-5 w-5 mr-1"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1"
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
                  Sync ({pendingChangesCount})
                </button>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
              >
                New Note
              </button>
              <button
                onClick={logout}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
              {error}
            </div>
          )}

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

          {offlineNotesCount > 0 && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                You have {offlineNotesCount} note
                {offlineNotesCount !== 1 ? "s" : ""} stored locally.
              </span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : allNotes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">You don't have any notes yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
              >
                Create Your First Note
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allNotes.map((note) => (
                <div
                  key={note.localId || `server-${note.id}`}
                  className="break-inside relative overflow-hidden flex flex-col justify-between space-y-2 text-sm rounded-xl max-w-[23rem] p-4 mb-4 text-white"
                  style={{ backgroundColor: note.color || "#FFFFFF" }}
                >
                  <div className="flex flex-row items-center justify-between">
                    <span className="text-base font-medium">{note.title}</span>
                    {/* Sync indicator */}
                    {note.synced ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-white opacity-80"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-white opacity-80 animate-pulse"
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
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Created: {formatDate(note.createdAt)}</span>
                    <button
                      className="flex items-center justify-center text-xs font-medium rounded-full px-4 py-2 space-x-1 bg-white text-black"
                      onClick={() =>
                        navigate(`/notes/${note.localId || note.id}`)
                      }
                    >
                      <span>Open</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="absolute bg-white border border-gray-600 rounded-lg shadow-lg w-full max-w-4xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Create New Note</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateNote} className="p-4">
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
                    height={300}
                    preview="edit"
                    previewOptions={{
                      rehypePlugins: [[rehypeSanitize]],
                    }}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Note Color</label>
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
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
                >
                  Create Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
