interface FooterProps {
  brandName: string;
  githubUrl?: string;
}

export default function Footer({ brandName, githubUrl }: FooterProps) {
  return (
    <footer className="px-6 py-12 sm:px-10">
      <div className="mx-auto mb-12 h-px max-w-4xl bg-gradient-to-r from-transparent via-muted/20 to-transparent" />

      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 font-body sm:flex-row">
        <span className="text-xs font-semibold tracking-widest uppercase text-muted">
          {brandName}
        </span>

        <div className="flex items-center gap-6">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted/50 transition-colors duration-200 hover:text-muted"
            >
              GitHub
            </a>
          )}
          <p className="text-xs text-muted/50">
            &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
