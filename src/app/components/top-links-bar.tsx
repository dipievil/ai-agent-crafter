import { getTranslations } from "next-intl/server";

type TopLinkItem = {
  id: "repo" | "issues" | "linkedin" | "github";
  href: string;
  icon: string;
};

const TOP_LINKS: TopLinkItem[] = [
  {
    id: "repo",
    href: "https://github.com/dipievil/ai-agent-crafter",
    icon: "📦"
  },
  {
    id: "issues",
    href: "https://github.com/dipievil/ai-agent-crafter/issues",
    icon: "📝"
  },
  {
    id: "linkedin",
    href: "https://www.linkedin.com/in/diegoritzel",
    icon: "💼"
  },
  {
    id: "github",
    href: "https://github.com/dipievil",
    icon: "🐙"
  }
];

export default async function TopLinksBar() {
  const t = await getTranslations("TopBar");

  return (
    <nav
      aria-label={t("ariaLabel")}
      className="group fixed left-4 top-2 z-50 flex h-10 w-10 items-center overflow-hidden rounded-2xl border border-foreground/20 bg-background/90 px-2 backdrop-blur-sm transition-all duration-200 ease-out hover:w-68 focus-within:w-72"
    >
      <span aria-hidden="true" className="mr-5 p-1 text-s text-foreground/80">
        ☰
      </span>

      <ul className="flex min-w-0 items-center gap-2">
        {TOP_LINKS.map((item) => {
          const label = t(`${item.id}.label`);
          const hint = t(`${item.id}.hint`);

          return (
            <li key={item.id} className="shrink-0">
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={hint}
                className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 text-s text-foreground transition-colors hover:border-foreground/20 focus-visible:border-foreground/50 focus-visible:outline-none"
              >
                <span aria-hidden="true">{item.icon}</span>
                <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-24 group-hover:opacity-100 group-focus-within:max-w-24 group-focus-within:opacity-100">
                  
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
