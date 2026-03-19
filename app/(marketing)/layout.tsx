import Link from "next/link";
import Image from "next/image";
import {
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
            <Link href="/" className="flex items-center gap-2">
              <Image src="/favicon-dashportal.png" alt="DashPortal" width={32} height={32} />
              <Image src="/logo-dashportal.png" alt="DashPortal" width={140} height={32} style={{ height: 28, width: "auto" }} />
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
              <Link
                href="/pricing/agencies"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Partners
              </Link>
              <Link
                href="/contact"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Contact
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
            <div className="flex items-center gap-2">
              <Image src="/favicon-dashportal.png" alt="DashPortal" width={28} height={28} />
              <Image src="/logo-dashportal.png" alt="DashPortal" width={120} height={28} style={{ height: 24, width: "auto" }} />
              <span className="text-xs text-text-secondary">
                by Power BI Studio
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
              <Link
                href="/contact"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Contact
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
