"use client";

import { showApiError } from "@/lib/error-toast";
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  useDmsFolders,
  useCreateDmsFolder,
  useUpdateDmsFolder,
  useDeleteDmsFolder,
} from "@/hooks/useDmsFolders";
import FolderExplorerWindow from "@/components/FolderExplorerWindow";
import type { DmsFolder, DmsFolderFormData } from "@/types/dms-folder";

type ModalMode = "create" | "edit" | "view" | "subfolder";

const emptyForm: DmsFolderFormData = {
  name: "",
  slug: "",
  folder_type: "personal",
  is_system: false,
  parent_id: null,
};

const DmsFoldersPage: React.FC = () => {
  const { data: folders = [], isLoading, error } = useDmsFolders();
  const createMutation = useCreateDmsFolder();
  const updateMutation = useUpdateDmsFolder();
  const deleteMutation = useDeleteDmsFolder();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedFolder, setSelectedFolder] = useState<DmsFolder | null>(null);
  const [formData, setFormData] = useState<DmsFolderFormData>(emptyForm);
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  useEffect(() => {
    if (error) showApiError(error, { fallbackMessage: "Failed to load folders." });
  }, [error]);

  const handleView = (folder: DmsFolder) => {
    setSelectedFolder(folder);
    setFormData({
      name: folder.name,
      slug: folder.slug,
      folder_type: folder.folder_type,
      is_system: folder.is_system,
      parent_id: folder.parent_id,
    });
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (folder: DmsFolder) => {
    setSelectedFolder(folder);
    setFormData({
      name: folder.name,
      slug: folder.slug,
      folder_type: folder.folder_type,
      is_system: folder.is_system,
      parent_id: folder.parent_id,
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  // parent === null means "create at whichever level is currently being browsed"
  const handleNewFolder = (parent: DmsFolder | null) => {
    setSelectedFolder(null);
    setFormData({ ...emptyForm, parent_id: parent ? parent.id : null });
    setModalMode(parent ? "subfolder" : "create");
    setIsModalOpen(true);
  };

  const handleDelete = (uuid: string) => setDeleteUuid(uuid);

  const confirmDelete = () => {
    if (!deleteUuid) return;
    deleteMutation.mutate(deleteUuid, {
      onSuccess: () => setDeleteUuid(null),
      onError: () => setDeleteUuid(null),
    });
  };

  const handleSave = () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error("Name is required.");
      return;
    }
    if (trimmedName.length > 150) {
      toast.error("Name cannot exceed 150 characters.");
      return;
    }
    const slug = formData.slug.trim() || trimmedName.toLowerCase().replace(/\s+/g, "-");
    const payload: DmsFolderFormData = {
      name: trimmedName,
      slug,
      folder_type: formData.folder_type || "personal",
      is_system: formData.is_system || false,
      parent_id: formData.parent_id || null,
    };

    if (modalMode === "create" || modalMode === "subfolder") {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    } else if (modalMode === "edit" && selectedFolder) {
      updateMutation.mutate(
        { uuid: selectedFolder.uuid, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  return (
    <div className=" p-4">
      <FolderExplorerWindow
        folders={folders}
        isLoading={isLoading}
        createPending={createMutation.isPending}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNewFolder={handleNewFolder}
      />

      {/* Create / Edit / View modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "New Folder"}
              {modalMode === "subfolder" && "New Subfolder"}
              {modalMode === "edit" && "Edit Folder"}
              {modalMode === "view" && "Folder Details"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create" && "Enter a name for the new folder."}
              {modalMode === "subfolder" && `Create a subfolder inside "${selectedFolder?.name || "the current folder"}"`}
              {modalMode === "edit" && "Update folder details."}
              {modalMode === "view" && "View folder information."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Name *</label>
              <div className="relative col-span-3">
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={modalMode === "view"}
                  maxLength={150}
                  className="pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {formData.name.length}/150
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Slug</label>
              <div className="col-span-3">
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  disabled={modalMode === "view"}
                  placeholder="auto-generated"
                  className="text-gray-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Type</label>
              <Select
                value={formData.folder_type || "personal"}
                onValueChange={(val) =>
                  setFormData({ ...formData, folder_type: val as DmsFolderFormData["folder_type"] })
                }
                disabled={modalMode === "view"}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {modalMode !== "view" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">System Folder</label>
                <div className="col-span-3">
                  <Select
                    value={formData.is_system ? "true" : "false"}
                    onValueChange={(val) => setFormData({ ...formData, is_system: val === "true" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {modalMode !== "view" ? (
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteUuid !== null} onOpenChange={() => setDeleteUuid(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the folder and all its subfolders (if any). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DmsFoldersPage;