"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, ArrowDown, Edit3, Eye, EyeOff, Lock, Unlock, GripVertical, Trash2, CheckCircle2 } from "lucide-react";
import {
  createCategory,
  createForum,
  createSection,
  reorderCategories,
  reorderForums,
  reorderSections,
  softDeleteCategory,
  softDeleteForum,
  softDeleteSection,
  updateCategory,
  updateForum,
  updateSection,
} from "./actions";

type Forum = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  isLocked: boolean;
  isDeleted?: boolean;
  sortOrder: number;
};
type Category = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  isLocked: boolean;
  isDeleted?: boolean;
  sortOrder: number;
  forums: Forum[];
};
type Section = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  isLocked: boolean;
  isDeleted?: boolean;
  sortOrder: number;
  categories: Category[];
};

export function StructureManager({ initialSections }: { initialSections: Section[] }) {
  const [sections, setSections] = useState(initialSections);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newSection, setNewSection] = useState("");
  const [dragging, setDragging] = useState<{ kind: "category" | "forum"; id: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ kind: "section" | "category"; id: string } | null>(null);

  function setResult(result: { error?: string } | undefined, message: string) {
    if (result?.error) {
      setSuccess(null);
      setError(result.error);
      return false;
    }
    setError(null);
    setSuccess(message);
    return true;
  }

  function moveSection(index: number, dir: -1 | 1) {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const normalized = next.map((item, sortOrder) => ({ ...item, sortOrder }));
    setSections(normalized);
    startTransition(async () => {
      const result = await reorderSections(normalized.map(({ id, sortOrder }) => ({ id, sortOrder })));
      if (result?.error) setError(result.error);
    });
  }

  function moveCategory(sectionId: string, index: number, dir: -1 | 1) {
    const section = sections.find((item) => item.id === sectionId);
    if (!section) return;
    const nextCats = [...section.categories];
    const target = index + dir;
    if (target < 0 || target >= nextCats.length) return;
    [nextCats[index], nextCats[target]] = [nextCats[target], nextCats[index]];
    const normalized = nextCats.map((item, sortOrder) => ({ ...item, sortOrder }));
    setSections((prev) => prev.map((item) => item.id === sectionId ? { ...item, categories: normalized } : item));
    startTransition(async () => {
      const result = await reorderCategories(normalized.map(({ id, sortOrder }) => ({ id, sortOrder })));
      if (result?.error) setError(result.error);
    });
  }

  function moveForum(sectionId: string, categoryId: string, index: number, dir: -1 | 1) {
    const section = sections.find((item) => item.id === sectionId);
    const category = section?.categories.find((item) => item.id === categoryId);
    if (!category) return;
    const nextForums = [...category.forums];
    const target = index + dir;
    if (target < 0 || target >= nextForums.length) return;
    [nextForums[index], nextForums[target]] = [nextForums[target], nextForums[index]];
    const normalized = nextForums.map((item, sortOrder) => ({ ...item, sortOrder }));
    setSections((prev) => prev.map((item) => item.id !== sectionId ? item : {
      ...item,
      categories: item.categories.map((cat) => cat.id === categoryId ? { ...cat, forums: normalized } : cat),
    }));
    startTransition(async () => {
      const result = await reorderForums(normalized.map(({ id, sortOrder }) => ({ id, sortOrder })));
      if (result?.error) setError(result.error);
    });
  }

  function patch(kind: "section" | "category" | "forum", ids: string[], data: Record<string, unknown>) {
    startTransition(async () => {
      const result =
        kind === "section" ? await updateSection({ id: ids[0], ...data }) :
        kind === "category" ? await updateCategory({ id: ids[0], ...data }) :
        await updateForum({ id: ids[0], ...data });
      if (!setResult(result, `${kind[0].toUpperCase()}${kind.slice(1)} updated.`)) return;
      setSections((prev) => updateLocalNode(prev, kind, ids[0], data));
    });
  }

  function softDelete(kind: "section" | "category" | "forum", id: string, name: string) {
    const label = kind === "section" ? "section" : kind;
    if (!window.confirm(`Soft-delete "${name}"? It will disappear from public browsing. Existing content stays in the database.`)) return;
    startTransition(async () => {
      const result =
        kind === "section" ? await softDeleteSection(id) :
        kind === "category" ? await softDeleteCategory(id) :
        await softDeleteForum(id);
      if (!setResult(result, `${label[0].toUpperCase()}${label.slice(1)} soft-deleted.`)) return;
      setSections((prev) => updateLocalNode(prev, kind, id, { isDeleted: true }));
    });
  }

  function moveCategoryToSection(categoryId: string, targetSectionId: string) {
    const sourceSection = sections.find((section) => section.categories.some((category) => category.id === categoryId));
    const targetSection = sections.find((section) => section.id === targetSectionId);
    const category = sourceSection?.categories.find((item) => item.id === categoryId);
    if (!sourceSection || !targetSection || !category || sourceSection.id === targetSection.id) return;
    const next = sections.map((section) => {
      if (section.id === sourceSection.id) {
        return {
          ...section,
          categories: section.categories.filter((item) => item.id !== categoryId).map((item, sortOrder) => ({ ...item, sortOrder })),
        };
      }
      if (section.id === targetSection.id) {
        return {
          ...section,
          categories: [...section.categories, { ...category, sortOrder: section.categories.length }],
        };
      }
      return section;
    });
    setSections(next);
    startTransition(async () => {
      const result = await updateCategory({ id: categoryId, sectionId: targetSectionId });
      const source = next.find((section) => section.id === sourceSection.id)!;
      const target = next.find((section) => section.id === targetSection.id)!;
      await reorderCategories(source.categories.map(({ id, sortOrder }) => ({ id, sortOrder })));
      await reorderCategories(target.categories.map(({ id, sortOrder }) => ({ id, sortOrder })));
      if (result?.error) setError(result.error);
    });
  }

  function moveForumToCategory(forumId: string, targetCategoryId: string) {
    let sourceCategory: Category | undefined;
    let targetCategory: Category | undefined;
    let forum: Forum | undefined;
    for (const section of sections) {
      for (const category of section.categories) {
        if (category.id === targetCategoryId) targetCategory = category;
        const found = category.forums.find((item) => item.id === forumId);
        if (found) {
          sourceCategory = category;
          forum = found;
        }
      }
    }
    if (!sourceCategory || !targetCategory || !forum || sourceCategory.id === targetCategory.id) return;
    const next = sections.map((section) => ({
      ...section,
      categories: section.categories.map((category) => {
        if (category.id === sourceCategory!.id) {
          return {
            ...category,
            forums: category.forums.filter((item) => item.id !== forumId).map((item, sortOrder) => ({ ...item, sortOrder })),
          };
        }
        if (category.id === targetCategory!.id) {
          return {
            ...category,
            forums: [...category.forums, { ...forum!, sortOrder: category.forums.length }],
          };
        }
        return category;
      }),
    }));
    setSections(next);
    startTransition(async () => {
      const result = await updateForum({ id: forumId, categoryId: targetCategoryId });
      const source = next.flatMap((section) => section.categories).find((category) => category.id === sourceCategory!.id)!;
      const target = next.flatMap((section) => section.categories).find((category) => category.id === targetCategory!.id)!;
      await reorderForums(source.forums.map(({ id, sortOrder }) => ({ id, sortOrder })));
      await reorderForums(target.forums.map(({ id, sortOrder }) => ({ id, sortOrder })));
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <div className="rounded-sm border-2 border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-sm border-2 border-success/50 bg-success/10 px-4 py-3 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* New Section */}
      <div className="card-elevated p-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          New Section
        </h2>
        <div className="flex gap-3">
          <input
            className="flex-1 rounded-sm border-2 border-border bg-background px-3 py-2 text-sm shadow-[1px_1px_0px_var(--border)]"
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            placeholder="Section name"
          />
          <Button
            disabled={!newSection.trim() || isPending}
            onClick={() => startTransition(async () => {
              const result = await createSection({ name: newSection });
              if (setResult(result, "Section created.")) location.reload();
            })}
          >
            <Plus className="h-4 w-4" />
            {isPending ? "Creating" : "Create"}
          </Button>
        </div>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No sections yet</p>
          <p className="empty-state-text">Create the first section to start building the public forum structure.</p>
        </div>
      ) : sections.map((section, sectionIndex) => (
        <section
          key={section.id}
          className={`card-elevated overflow-hidden ${
            section.isDeleted ? "opacity-60" : ""
          } ${
            dropTarget?.kind === "section" && dropTarget.id === section.id
              ? "ring-2 ring-primary"
              : ""
          }`}
          onDragOver={(event) => {
            if (dragging?.kind === "category") {
              event.preventDefault();
              setDropTarget({ kind: "section", id: section.id });
            }
          }}
          onDragLeave={() => {
            if (dropTarget?.kind === "section" && dropTarget.id === section.id) setDropTarget(null);
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (dragging?.kind === "category") moveCategoryToSection(dragging.id, section.id);
            setDragging(null);
            setDropTarget(null);
          }}
        >
          <Row
            level="Section"
            name={section.name}
            description={section.description}
            visible={section.isPublic}
            locked={section.isLocked}
            onUp={() => moveSection(sectionIndex, -1)}
            onDown={() => moveSection(sectionIndex, 1)}
            disableUp={sectionIndex === 0}
            disableDown={sectionIndex === sections.length - 1}
            onToggleVisible={() => patch("section", [section.id], { isPublic: !section.isPublic })}
            onToggleLocked={() => patch("section", [section.id], { isLocked: !section.isLocked })}
            onRename={(name, description) => patch("section", [section.id], { name, description })}
            onSoftDelete={() => softDelete("section", section.id, section.name)}
          />
          <div className="space-y-3 border-t-2 border-border p-4">
            {dragging?.kind === "category" && dropTarget?.kind === "section" && dropTarget.id === section.id && (
              <div className="rounded-sm border-2 border-dashed border-primary bg-primary/5 px-3 py-2 text-xs text-primary font-medium">
                Drop category into {section.name}
              </div>
            )}
            <InlineCreate label="New Category" onCreate={(name) => createCategory({ sectionId: section.id, name })} onSuccess={() => setSuccess("Category created.")} onError={(message) => { setSuccess(null); setError(message); }} />
            {section.categories.length === 0 && (
              <div className="rounded-sm border-2 border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                No categories in this section.
              </div>
            )}
            {section.categories.map((category, categoryIndex) => (
              <div
                key={category.id}
                className={`rounded-sm border-2 border-border overflow-hidden ${
                  dropTarget?.kind === "category" && dropTarget.id === category.id
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onDragOver={(event) => {
                  if (dragging?.kind === "forum") {
                    event.preventDefault();
                    setDropTarget({ kind: "category", id: category.id });
                  }
                }}
                onDragLeave={() => {
                  if (dropTarget?.kind === "category" && dropTarget.id === category.id) setDropTarget(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragging?.kind === "forum") moveForumToCategory(dragging.id, category.id);
                  setDragging(null);
                  setDropTarget(null);
                }}
              >
                <Row
                  level="Category"
                  onDragStart={() => setDragging({ kind: "category", id: category.id })}
                  onDragEnd={() => { setDragging(null); setDropTarget(null); }}
                  name={category.name}
                  description={category.description}
                  visible={category.isPublic}
                  locked={category.isLocked}
                  onUp={() => moveCategory(section.id, categoryIndex, -1)}
                  onDown={() => moveCategory(section.id, categoryIndex, 1)}
                  disableUp={categoryIndex === 0}
                  disableDown={categoryIndex === section.categories.length - 1}
                  onToggleVisible={() => patch("category", [category.id], { isPublic: !category.isPublic })}
                  onToggleLocked={() => patch("category", [category.id], { isLocked: !category.isLocked })}
                  onRename={(name, description) => patch("category", [category.id], { name, description })}
                  onSoftDelete={() => softDelete("category", category.id, category.name)}
                />
                <div className="space-y-2 border-t-2 border-border p-3 pl-8">
                  {dragging?.kind === "forum" && dropTarget?.kind === "category" && dropTarget.id === category.id && (
                    <div className="rounded-sm border-2 border-dashed border-primary bg-primary/5 px-3 py-2 text-xs text-primary font-medium">
                      Drop forum into {category.name}
                    </div>
                  )}
                  <InlineCreate label="New Forum" onCreate={(name) => createForum({ categoryId: category.id, name })} onSuccess={() => setSuccess("Forum created.")} onError={(message) => { setSuccess(null); setError(message); }} />
                  {category.forums.length === 0 && (
                    <div className="rounded-sm border-2 border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
                      No forums in this category.
                    </div>
                  )}
                  {category.forums.map((forum, forumIndex) => (
                    <Row
                      key={forum.id}
                      level="Forum"
                      onDragStart={() => setDragging({ kind: "forum", id: forum.id })}
                      onDragEnd={() => { setDragging(null); setDropTarget(null); }}
                      name={forum.name}
                      description={forum.description}
                      visible={forum.isPublic}
                      locked={forum.isLocked}
                      onUp={() => moveForum(section.id, category.id, forumIndex, -1)}
                      onDown={() => moveForum(section.id, category.id, forumIndex, 1)}
                      disableUp={forumIndex === 0}
                      disableDown={forumIndex === category.forums.length - 1}
                      onToggleVisible={() => patch("forum", [forum.id], { isPublic: !forum.isPublic })}
                      onToggleLocked={() => patch("forum", [forum.id], { isLocked: !forum.isLocked })}
                      onRename={(name, description) => patch("forum", [forum.id], { name, description })}
                      onSoftDelete={() => softDelete("forum", forum.id, forum.name)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function InlineCreate({
  label,
  onCreate,
  onSuccess,
  onError,
}: {
  label: string;
  onCreate: (name: string) => Promise<{ error?: string } | unknown>;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <input
        className="flex-1 rounded-sm border-2 border-border bg-background px-3 py-2 text-sm shadow-[1px_1px_0px_var(--border)]"
        placeholder={label}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button size="sm" disabled={!name.trim() || isPending} onClick={() => startTransition(async () => {
        const result = await onCreate(name);
        if (typeof result === "object" && result && "error" in result && typeof result.error === "string") {
          onError(result.error);
          return;
        }
        onSuccess();
        location.reload();
      })}>
        <Plus className="h-3.5 w-3.5" />
        {isPending ? "Adding" : "Add"}
      </Button>
    </div>
  );
}

function Row(props: {
  level: string; name: string; description: string | null; visible: boolean; locked: boolean;
  onUp: () => void; onDown: () => void; disableUp: boolean; disableDown: boolean;
  onToggleVisible: () => void; onToggleLocked: () => void; onRename: (name: string, description?: string) => void;
  onSoftDelete: () => void;
  draggable?: boolean; onDragStart?: () => void; onDragEnd?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(props.name);
  const [description, setDescription] = useState(props.description ?? "");
  return (
    <div className="px-4 py-3">
      {editing ? (
        <div className="space-y-2">
          <input
            className="w-full rounded-sm border-2 border-border bg-background px-3 py-2 text-sm shadow-[1px_1px_0px_var(--border)]"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full rounded-sm border-2 border-border bg-background px-3 py-2 text-sm shadow-[1px_1px_0px_var(--border)]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { props.onRename(name, description); setEditing(false); }}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {props.onDragStart && (
            <button
              type="button"
              draggable
              onDragStart={props.onDragStart}
              onDragEnd={props.onDragEnd}
              className="cursor-grab rounded-sm px-1 py-1 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
              title={`Move ${props.level.toLowerCase()}`}
              aria-label={`Move ${props.level.toLowerCase()}`}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase">
            {props.level}
          </span>
          <span className="text-sm font-semibold">{props.name}</span>
          {!props.visible && <span className="badge-amber text-[10px] py-0">Hidden</span>}
          {props.locked && <span className="badge-amber text-[10px] py-0">Locked</span>}
          <div className="ml-auto flex flex-wrap gap-1">
            <Button size="sm" variant="outline" disabled={props.disableUp} onClick={props.onUp} className="h-8 w-8 p-0">
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" disabled={props.disableDown} onClick={props.onDown} className="h-8 w-8 p-0">
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="h-8 gap-1">
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (
                  props.visible &&
                  !window.confirm(`Hide "${props.name}" from public browsing?`)
                ) {
                  return;
                }
                props.onToggleVisible();
              }}
              className="h-8 gap-1"
            >
              {props.visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {props.visible ? "Hide" : "Show"}
            </Button>
            <Button size="sm" variant="outline" onClick={props.onToggleLocked} className="h-8 gap-1">
              {props.locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {props.locked ? "Unlock" : "Lock"}
            </Button>
            <Button size="sm" variant="outline" onClick={props.onSoftDelete} disabled={!props.visible} className="h-8 gap-1">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function updateLocalNode(
  sections: Section[],
  kind: "section" | "category" | "forum",
  id: string,
  data: Record<string, unknown>,
): Section[] {
  return sections.map((section) => {
    if (kind === "section" && section.id === id) {
      return { ...section, ...data };
    }
    return {
      ...section,
      categories: section.categories.map((category) => {
        if (kind === "category" && category.id === id) {
          return { ...category, ...data };
        }
        return {
          ...category,
          forums: category.forums.map((forum) =>
            kind === "forum" && forum.id === id ? { ...forum, ...data } : forum,
          ),
        };
      }),
    };
  });
}
