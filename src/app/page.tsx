import { MessageSquareText, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Browse public discussions",
    description: "Read categories and threads without an account.",
    icon: Search,
  },
  {
    title: "Start focused threads",
    description: "Ask questions and keep replies organized.",
    icon: MessageSquareText,
  },
  {
    title: "Moderate from day one",
    description: "Reports and soft deletes are part of the MVP plan.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-muted-foreground">
            Forum MVP
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
            A clean foundation for a focused community forum.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            This scaffold is ready for categories, threads, replies, search,
            and moderation without pulling post-MVP features into the first
            build.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button>View roadmap</Button>
            <Button variant="outline">Read architecture</Button>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-lg border bg-card p-5 text-card-foreground"
            >
              <feature.icon className="h-5 w-5 text-muted-foreground" />
              <h2 className="mt-4 text-base font-medium">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
