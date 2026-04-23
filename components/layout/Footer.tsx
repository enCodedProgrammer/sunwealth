import Link from "next/link";
import { LogoLight } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";

const SUNWEALTH_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/journal", label: "Journal" },
  { href: "/diaspora", label: "Diaspora" },
];

const BROWSE_LINKS = [
  { href: "/properties", label: "Properties" },
  { href: "/rentals", label: "Rentals" },
  { href: "/land", label: "Land" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-ink text-paper mt-24">
      <Container>
        <div className="py-16">
          <LogoLight width={180} />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-12">
            <FooterColumn title="Sunwealth" links={SUNWEALTH_LINKS} />
            <FooterColumn title="Browse" links={BROWSE_LINKS} />

            <div>
              <h3 className="text-xs uppercase tracking-wider text-stone mb-4">
                Connect
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://wa.me/2349038379755"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gold transition-colors"
                  >
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+2349038379755"
                    className="font-mono hover:text-gold transition-colors"
                  >
                    +234 903 837 9755
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/sunwealthltd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gold transition-colors"
                  >
                    Instagram @sunwealthltd
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-6 border-t border-gold/30 flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-stone">
            <p>
              Sunwealth Real Estate Limited · RC{" "}
              <span className="font-mono">1739523</span> · Lagos, Nigeria
            </p>
            <p>
              © <span className="font-mono">{year}</span> All rights reserved
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider text-stone mb-4">
        {title}
      </h3>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="hover:text-gold transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
