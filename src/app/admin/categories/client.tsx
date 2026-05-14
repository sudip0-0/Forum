"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  createCategory,
  updateCategory,
  softDeleteCategory,
  reorderCategories,
} from "./actions";

export function AdminCategoryList({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Category[]>(categories);
  const [isPending, startTransition] = useTransition();
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editForm, setEditForm] = useState<{
    name: string;
    slug: string;
    description: string;
  }>({ name: "", slug: "", description: "" });

  function clearError() {
    setError(null);
  }

  function handleCreate() {
    clearError();
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await createCategory({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setNewName("");
        setNewDesc("");
        router.refresh();
      }
    });
  }

  function handleUpdate(id: string) {
    clearError();
    startTransition(async () => {
      const result = await updateCategory({
        id,
        name: editForm.name.trim() || undefined,
        slug: editForm.slug.trim() || undefined,
        description: editForm.description || undefined,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setEditId(null);
        router.refresh();
      }
    });
  }

  function handleSoftDelete(id: string) {
    clearError();
    startTransition(async () => {
      const result = await softDeleteCategory(id);
      if (result.error) {
        setError(result.error);
      } else {
        setItems((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      }
    });
  }

  function handleToggleVisibility(cat: Category) {
    clearError();
    startTransition(async () => {
      const result = await updateCategory({
        id: cat.id,
        isPublic: !cat.isPublic,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setItems((prev) =>
          prev.map((c) =>
            c.id === cat.id ? { ...c, isPublic: !cat.isPublic } : c,
          ),
        );
      }
    });
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    clearError();
    const reordered = [...items];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    const payload = reordered.map((c, i) => ({ id: c.id, sortOrder: i }));
    setItems(reordered.map((c, i) => ({ ...c, sortOrder: i })));
    startTransition(async () => {
      const result = await reorderCategories(payload);
      if (result.error) {
        setError(result.error);
        setItems(items); // revert
      }
    });
  }

  function handleMoveDown(index: number) {
    if (index === items.length - 1) return;
    clearError();
    const reordered = [...items];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    const payload = reordered.map((c, i) => ({ id: c.id, sortOrder: i }));
    setItems(reordered.map((c, i) => ({ ...c, sortOrder: i })));
    startTransition(async () => {
      const result = await reorderCategories(payload);
      if (result.error) {
        setError(result.error);
        setItems(items); // revert
      }
    });
  }

  function startEdit(cat: Category) {
    setEditId(cat.id);
    setEditForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
    });
  }

  function cancelEdit() {
    setEditId(null);
    setError(null);
  }

  return (
    <div className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-lg border p-4">
        <h2 className="text-sm font-medium">New Category</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <input
            className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={isPending}
          />
          <input
            className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            disabled={isPending}
          />
          <Button onClick={handleCreate} disabled={isPending || !newName.trim()}>
            Create
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {items.map((cat, index) => (
            <li key={cat.id} className="px-4 py-3">
              {editId === cat.id ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <input
                      className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Name"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      disabled={isPending}
                    />
                    <input
                      className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Slug"
                      value={editForm.slug}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, slug: e.target.value }))
                      }
                      disabled={isPending}
                    />
                  </div>
                  <input
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Description"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    disabled={isPending}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdate(cat.id)} disabled={isPending}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      /{cat.slug}
                    </span>
                    {cat.description && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveUp(index)}
                      disabled={isPending || index === 0}
                      aria-label="Move up"
                    >
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveDown(index)}
                      disabled={isPending || index === items.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </Button>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        cat.isPublic
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {cat.isPublic ? "Visible" : "Hidden"}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => startEdit(cat)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleVisibility(cat)}
                      disabled={isPending}
                    >
                      {cat.isPublic ? "Hide" : "Show"}
                    </Button>
                    {cat.isPublic && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleSoftDelete(cat.id)}
                        disabled={isPending}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
