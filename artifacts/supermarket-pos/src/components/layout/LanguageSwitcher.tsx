import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/i18n";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function resolveBaseCode(language: string): string {
  return language.split("-")[0];
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const activeCode = resolveBaseCode(i18n.resolvedLanguage ?? i18n.language);
  const current = LANGUAGES.find((l) => l.code === activeCode) || LANGUAGES[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    const lang = LANGUAGES.find((l) => l.code === code);
    document.documentElement.dir = lang?.dir ?? "rtl";
    document.documentElement.lang = code;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
          <Globe className="h-4 w-4 shrink-0" />
          <span className="truncate">{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-44">
        {LANGUAGES.map((lang) => {
          const isActive = i18n.language === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className="flex items-center justify-between gap-2 cursor-pointer"
            >
              <span className={isActive ? "font-semibold text-primary" : ""}>{lang.label}</span>
              {isActive && <Check className="h-4 w-4 text-primary shrink-0" aria-label="selected" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
