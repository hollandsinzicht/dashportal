import Link from "next/link";
import {
  BarChart3,
  ArrowRight,
} from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-[family-name:var(--font-syne)] font-bold text-lg text-text-primary">
                DashPortal
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/#features"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Prijzen
              </Link>
              <Link
                href="/demo"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Demo
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/onboarding/plan"
                className="inline-flex items-center gap-2 h-10 px-5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Start gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {children}

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="font-[family-name:var(--font-syne)] font-bold text-text-primary">
                DashPortal
              </span>
              <span className="text-xs text-text-secondary">
                by DashPortal
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/demo"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Demo
              </Link>
              <span className="text-text-secondary/30">|</span>
              <Link
                href="/privacy"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Privacybeleid
              </Link>
              <span className="text-text-secondary/30">|</span>
              <Link
                href="/terms"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Voorwaarden
              </Link>
              <span className="text-text-secondary/30">|</span>
              <Link
                href="/disclaimer"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Disclaimer
              </Link>
              <span className="text-text-secondary/30">|</span>
              <p className="text-sm text-text-secondary">
                &copy; {new Date().getFullYear()} DashPortal
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
