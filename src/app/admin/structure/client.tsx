"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  createCategory,
  createForum,
  createSection,
  reorderCategories,
  reorderForums,
  reorderSections,
  updateCategory,
  updateForum,
  updateSection,
} from "./actions";

type Forum = { id: string; name: string; description: string | null; isPublic: boolean; isLocked: boolean; sortOrder: number };
type Category = { id: string; name: string; description: string | null; isPublic: boolean; isLocked: boolean; sortOrder: number; forums: Forum[] };
type Section = { id: string; name: string; description: string | null; isPublic: boolean; isLocked: boolean; sortOrder: number; categories: Category[] };

export function StructureManager({ initialSections }: { initialSections: Section[] }) {
  const [sections, setSections] = useState(initialSections);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newSection, setNewSection] = useState("");
  const [dragging, setDragging] = useState<{ kind: "category" | "forum"; id: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ kind: "section" | "category"; id: string } | null>(null);

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
      if (result?.error) setError(result.error);
      else location.reload();
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
    <div className="mt-8 space-y-5">
      {error && <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      <div className="rounded-lg border p-4">
        <h2 className="text-sm font-medium">New Section</h2>
        <div className="mt-3 flex gap-3">
          <input className="flex-1 rounded-md border px-3 py-2 text-sm" value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="Section name" />
          <Button disabled={!newSection.trim() || isPending} onClick={() => startTransition(async () => { await createSection({ name: newSection }); location.reload(); })}>Create</Button>
        </div>
      </div>
      {sections.map((section, sectionIndex) => (
        <section
          key={section.id}
          className={`rounded-lg border transition ${
            dropTarget?.kind === "section" && dropTarget.id === section.id
              ? "border-primary ring-2 ring-primary/20"
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
          />
          <div className="space-y-3 border-t p-4">
            {dragging?.kind === "category" && dropTarget?.kind === "section" && dropTarget.id === section.id && (
              <div className="rounded-md border border-dashed border-primary bg-primary/5 px-3 py-2 text-xs text-primary">
                Drop category into {section.name}
              </div>
            )}
            <InlineCreate label="New Category" onCreate={(name) => createCategory({ sectionId: section.id, name })} />
            {section.categories.map((category, categoryIndex) => (
              <div
                key={category.id}
                className={`rounded-md border transition ${
                  dropTarget?.kind === "category" && dropTarget.id === category.id
                    ? "border-primary ring-2 ring-primary/20"
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
                />
                <div className="space-y-2 border-t p-3 pl-8">
                  {dragging?.kind === "forum" && dropTarget?.kind === "category" && dropTarget.id === category.id && (
                    <div className="rounded-md border border-dashed border-primary bg-primary/5 px-3 py-2 text-xs text-primary">
                      Drop forum into {category.name}
                    </div>
                  )}
                  <InlineCreate label="New Forum" onCreate={(name) => createForum({ categoryId: category.id, name })} />
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

function InlineCreate({ label, onCreate }: { label: string; onCreate: (name: string) => Promise<unknown> }) {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  return <div className="flex gap-2"><input className="flex-1 rounded-md border px-3 py-2 text-sm" placeholder={label} value={name} onChange={(e) => setName(e.target.value)} /><Button size="sm" disabled={!name.trim() || isPending} onClick={() => startTransition(async () => { await onCreate(name); location.reload(); })}>Add</Button></div>;
}

function Row(props: {
  level: string; name: string; description: string | null; visible: boolean; locked: boolean;
  onUp: () => void; onDown: () => void; disableUp: boolean; disableDown: boolean;
  onToggleVisible: () => void; onToggleLocked: () => void; onRename: (name: string, description?: string) => void;
  draggable?: boolean; onDragStart?: () => void; onDragEnd?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(props.name);
  const [description, setDescription] = useState(props.description ?? "");
  return <div className="p-3">
    {editing ? <div className="space-y-2">
      <input className="w-full rounded-md border px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="w-full rounded-md border px-3 py-2 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      <div className="flex gap-2"><Button size="sm" onClick={() => { props.onRename(name, description); setEditing(false); }}>Save</Button><Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button></div>
    </div> : <div className="flex flex-wrap items-center gap-2">
      {props.onDragStart && (
        <button
          type="button"
          draggable
          onDragStart={props.onDragStart}
          onDragEnd={props.onDragEnd}
          className="cursor-grab rounded px-1.5 py-1 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
          title={`Move ${props.level.toLowerCase()}`}
          aria-label={`Move ${props.level.toLowerCase()}`}
        >
          ⋮⋮
        </button>
      )}
      <span className="text-xs text-muted-foreground">{props.level}</span>
      <span className="font-medium">{props.name}</span>
      {!props.visible && <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs">Hidden</span>}
      {props.locked && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs">Locked</span>}
      <div className="ml-auto flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={props.disableUp} onClick={props.onUp}>↑</Button>
        <Button size="sm" variant="outline" disabled={props.disableDown} onClick={props.onDown}>↓</Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
        <Button size="sm" variant="outline" onClick={props.onToggleVisible}>{props.visible ? "Hide" : "Show"}</Button>
        <Button size="sm" variant="outline" onClick={props.onToggleLocked}>{props.locked ? "Unlock" : "Lock"}</Button>
      </div>
    </div>}
  </div>;
}
