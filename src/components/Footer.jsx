export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full border-t transition-colors duration-300 py-6 px-4"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-light)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 text-sm">
          {/* Copyright Section - Left */}
          <div style={{ color: 'var(--text-secondary)' }}>
            <p>
              &copy; {currentYear} Xhenfy WiFi. All rights reserved.
            </p>
          </div>

          {/* Developer Credit - Right */}
          <div style={{ color: 'var(--text-secondary)' }}>
            <p>
              Developed by{' '}
              <a
                href="https://xhenvolt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold transition-colors hover:underline"
                style={{ color: 'var(--primary-color)' }}
              >
                xhenvolt
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
