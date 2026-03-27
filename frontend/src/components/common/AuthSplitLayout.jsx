import React from 'react';

export default function AuthSplitLayout({
  badge,
  panelTitle = 'Sign in',
  panelSubtitle,
  welcomeLabel = 'WELCOME',
  welcomeTitle,
  welcomeDescription,
  welcomeNote,
  footer,
  children,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sidebar via-primary-dark to-primary-500 px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-[0_35px_90px_-35px_rgba(15,23,42,0.55)]">
          <div className="grid lg:grid-cols-[1.02fr_0.98fr]">
            <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-sidebar px-8 py-10 sm:px-10 sm:py-12 lg:min-h-[620px] lg:px-12 lg:py-14">
              <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/95" />
              <div className="absolute -left-24 bottom-0 h-48 w-48 rounded-full bg-white/10" />
              <div className="absolute bottom-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gradient-to-br from-primary-200/80 to-primary-700/90 shadow-2xl shadow-primary-950/25" />
              <div className="absolute left-8 top-8 h-24 w-24 rounded-3xl bg-white/8 blur-[2px]" />

              <div className="relative z-10 max-w-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/85">
                  {welcomeLabel}
                </p>
                <h1 className="mt-6 text-4xl font-bold uppercase tracking-[0.12em] text-white sm:text-5xl">
                  {welcomeTitle}
                </h1>
                <p className="mt-6 max-w-xs text-sm leading-7 text-white/85 sm:text-base">
                  {welcomeDescription}
                </p>
                {welcomeNote && (
                  <p className="mt-5 max-w-sm text-xs leading-6 text-white/65 sm:text-sm">
                    {welcomeNote}
                  </p>
                )}
              </div>
            </section>

            <section className="flex flex-col justify-center bg-white px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
              {badge && (
                <span className="mb-5 inline-flex w-fit items-center rounded-full border border-primary-100 bg-primary-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
                  {badge}
                </span>
              )}
              <h2 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
                {panelTitle}
              </h2>
              {panelSubtitle && (
                <p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">
                  {panelSubtitle}
                </p>
              )}

              <div className="mt-8">{children}</div>

              {footer && <div className="mt-8">{footer}</div>}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
