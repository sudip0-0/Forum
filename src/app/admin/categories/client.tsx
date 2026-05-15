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
import { Plus, ArrowUp, ArrowDown, Eye, EyeOff, Edit3, Trash2 } from "lucide-react";

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
        setItems(items);
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
        setItems(items);
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
    <div className="mt-6 space-y-6">
      {error && (
        <div className="rounded-xl border-2 border-destructive/30 bg-destructive/10 px-5 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-xl border-2 border-border bg-card p-5 shadow-brutal-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Plus className="h-4 w-4 text-primary" />
          New Category
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            className="input min-w-0 flex-1 rounded-lg border-2 border-border bg-background px-3 py-2 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={isPending}
          />
          <input
            className="input min-w-0 flex-1 rounded-lg border-2 border-border bg-background px-3 py-2 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
        <p className="py-12 text-center text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <ul className="divide-y divide-border/50 overflow-hidden rounded-xl border-2 border-border">
          {items.map((cat, index) => (
            <li key={cat.id} className="bg-card px-5 py-4 transition-colors hover:bg-muted/20">
              {editId === cat.id ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <input
                      className="input min-w-0 flex-1 rounded-lg border-2 border-border bg-background px-3 py-2 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Name"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      disabled={isPending}
                    />
                    <input
                      className="input min-w-0 flex-1 rounded-lg border-2 border-border bg-background px-3 py-2 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Slug"
                      value={editForm.slug}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, slug: e.target.value }))
                      }
                      disabled={isPending}
                    />
                  </div>
                  <input
                    className="input w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{cat.name}</span>
                      <span className="text-xs text-muted-foreground/70">
                        /{cat.slug}
                      </span>
                      <span
                        className={`badge ${
                          cat.isPublic
                            ? "badge-green"
                            : "badge-neutral"
                        }`}
                      >
                        {cat.isPublic ? "Visible" : "Hidden"}
                      </span>
                    </div>
                    {cat.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground/70">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMoveUp(index)}
                      disabled={isPending || index === 0}
                      aria-label="Move up"
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMoveDown(index)}
                      disabled={isPending || index === items.length - 1}
                      aria-label="Move down"
                      className="h-8 w-8 p-0"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => startEdit(cat)}>
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleVisibility(cat)}
                      disabled={isPending}
                    >
                      {cat.isPublic ? (
                        <><EyeOff className="h-3.5 w-3.5" /> Hide</>
                      ) : (
                        <><Eye className="h-3.5 w-3.5" /> Show</>
                      )}
                    </Button>
                    {!cat.isPublic && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleSoftDelete(cat.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
