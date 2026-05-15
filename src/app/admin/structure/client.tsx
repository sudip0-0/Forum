"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createCategory, createForum, createSection } from "./actions";

export function StructureManager({
  sections,
  categories,
}: {
  sections: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [sectionName, setSectionName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [forumName, setForumName] = useState("");
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border p-4">
        <h2 className="text-sm font-medium">New Section</h2>
        <input className="mt-3 w-full rounded-md border px-3 py-2 text-sm" value={sectionName} onChange={(e) => setSectionName(e.target.value)} placeholder="Section name" />
        <Button className="mt-3" disabled={isPending || !sectionName.trim()} onClick={() => startTransition(async () => { await createSection({ name: sectionName }); setSectionName(""); })}>Create</Button>
      </div>
      <div className="rounded-lg border p-4">
        <h2 className="text-sm font-medium">New Category</h2>
        <select className="mt-3 w-full rounded-md border px-3 py-2 text-sm" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
          {sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
        </select>
        <input className="mt-3 w-full rounded-md border px-3 py-2 text-sm" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Category name" />
        <Button className="mt-3" disabled={isPending || !sectionId || !categoryName.trim()} onClick={() => startTransition(async () => { await createCategory({ sectionId, name: categoryName }); setCategoryName(""); })}>Create</Button>
      </div>
      <div className="rounded-lg border p-4">
        <h2 className="text-sm font-medium">New Forum</h2>
        <select className="mt-3 w-full rounded-md border px-3 py-2 text-sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <input className="mt-3 w-full rounded-md border px-3 py-2 text-sm" value={forumName} onChange={(e) => setForumName(e.target.value)} placeholder="Forum name" />
        <Button className="mt-3" disabled={isPending || !categoryId || !forumName.trim()} onClick={() => startTransition(async () => { await createForum({ categoryId, name: forumName }); setForumName(""); })}>Create</Button>
      </div>
    </div>
  );
}
