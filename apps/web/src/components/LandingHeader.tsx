import { useEffect, useState } from "react";
import { GraduationCap, Menu, Moon, Sun } from "lucide-react";

import { Button } from "@english-app/ui";
import { Sheet, SheetContent, SheetTrigger } from "@english-app/ui";

interface LandingHeaderProps {
  onLogin: () => void;
  onGetStarted: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function LandingHeader({ onLogin, onGetStarted, theme, onToggleTheme }: LandingHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Detect active section
      const sections = [
        "hero",
        "como-funciona",
        "metodo",
        "demo",
        "depoimentos",
        "beneficios",
        "faq",
      ];
      const current = sections.find((section) => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const navLinks = [
    { id: "como-funciona", label: "Como Funciona" },
    { id: "metodo", label: "Método APA" },
    { id: "depoimentos", label: "Depoimentos" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => scrollToSection("hero")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span
              className={`hidden sm:block transition-colors ${
                isScrolled ? "text-neutral-900 dark:text-white" : "text-neutral-900 dark:text-white"
              }`}
            >
              English AI Tutor
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`text-sm transition-colors relative ${
                  activeSection === link.id
                    ? "text-blue-600 dark:text-blue-400"
                    : isScrolled
                      ? "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                      : "text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {link.label}
                {activeSection === link.id && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              className={isScrolled ? "" : "text-neutral-700 dark:text-neutral-200"}
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              onClick={onLogin}
              className={
                isScrolled
                  ? ""
                  : "text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white"
              }
            >
              Entrar
            </Button>

            <Button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Começar Grátis
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              className={isScrolled ? "" : "text-neutral-700 dark:text-neutral-200"}
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={isScrolled ? "" : "text-neutral-700 dark:text-neutral-200"}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-6 mt-8">
                  {navLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.id)}
                      className={`text-left text-lg transition-colors ${
                        activeSection === link.id
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      {link.label}
                    </button>
                  ))}

                  <div className="border-t pt-6 space-y-3">
                    <Button variant="outline" onClick={onLogin} className="w-full">
                      Entrar
                    </Button>

                    <Button
                      onClick={onGetStarted}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      Começar Grátis
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
