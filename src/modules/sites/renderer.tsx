import React from 'react';
import Image from 'next/image';
import type { SiteDocument, SiteSection } from '@/lib/adapters/ai';

/**
 * Theme styles mapping
 */
const themeConfig = {
  modern: {
    heroGradient: 'from-slate-900 to-slate-800',
    accentColor: 'text-blue-600',
    buttonStyle: 'bg-blue-600 hover:bg-blue-700',
  },
  warm: {
    heroGradient: 'from-amber-900 to-amber-800',
    accentColor: 'text-amber-600',
    buttonStyle: 'bg-amber-600 hover:bg-amber-700',
  },
  bold: {
    heroGradient: 'from-purple-900 to-purple-800',
    accentColor: 'text-purple-600',
    buttonStyle: 'bg-purple-600 hover:bg-purple-700',
  },
};

type Theme = keyof typeof themeConfig;

/**
 * Hero section component
 */
function HeroSection({
  section,
  theme,
}: {
  section: Extract<SiteSection, { type: 'hero' }>;
  theme: Theme;
}) {
  const config = themeConfig[theme];

  return (
    <div
      className={`relative min-h-screen bg-gradient-to-br ${config.heroGradient} flex items-center justify-center px-4`}
      style={
        section.backgroundImageUrl
          ? {
              backgroundImage: `url(${section.backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {}
      }
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-w-3xl text-center text-white">
        <h1 className="mb-6 text-5xl font-bold md:text-6xl">{section.headline}</h1>
        <p className="mb-8 text-xl text-gray-200 md:text-2xl">{section.subheadline}</p>
        <button
          className={`${config.buttonStyle} rounded-lg px-8 py-3 text-lg font-semibold text-white transition`}
        >
          {section.ctaText}
        </button>
      </div>
    </div>
  );
}

/**
 * About section component
 */
function AboutSection({
  section,
  theme,
}: {
  section: Extract<SiteSection, { type: 'about' }>;
  theme: Theme;
}) {
  const config = themeConfig[theme];

  return (
    <section className="bg-white px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className={`mb-6 text-4xl font-bold ${config.accentColor}`}>{section.heading}</h2>
            <p className="text-lg leading-relaxed text-gray-700">{section.content}</p>
          </div>
          {section.imageUrl && (
            <div className="overflow-hidden rounded-lg shadow-lg">
              <Image
                src={section.imageUrl}
                alt={section.heading}
                width={600}
                height={400}
                className="h-auto w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Services section component
 */
function ServicesSection({
  section,
  theme,
}: {
  section: Extract<SiteSection, { type: 'services' }>;
  theme: Theme;
}) {
  const config = themeConfig[theme];

  return (
    <section className="bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className={`mb-4 text-center text-4xl font-bold ${config.accentColor}`}>
          {section.heading}
        </h2>
        <p className="mb-12 text-center text-gray-600">{section.description}</p>

        <div className="grid gap-8 md:grid-cols-3">
          {section.services.map((service, idx) => (
            <div key={idx} className="rounded-lg bg-white p-8 shadow">
              <h3 className="mb-3 text-xl font-bold">{service.name}</h3>
              <p className="mb-4 text-gray-600">{service.description}</p>
              {service.price && (
                <p className={`font-semibold ${config.accentColor}`}>{service.price}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Reviews section component
 */
function ReviewsSection({
  section,
  theme,
}: {
  section: Extract<SiteSection, { type: 'reviews' }>;
  theme: Theme;
}) {
  const config = themeConfig[theme];

  return (
    <section className="bg-white px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className={`mb-12 text-center text-4xl font-bold ${config.accentColor}`}>
          {section.heading}
        </h2>

        <div className="grid gap-8 md:grid-cols-2">
          {section.reviews.map((review, idx) => (
            <div key={idx} className="rounded-lg bg-gray-50 p-8">
              <div className="mb-3 flex">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <span key={i} className="text-xl text-yellow-400">
                    ★
                  </span>
                ))}
              </div>
              <p className="mb-4 text-gray-700">{review.text}</p>
              <p className="font-semibold">{review.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * CTA section component
 */
function CTASection({
  section,
  theme,
}: {
  section: Extract<SiteSection, { type: 'cta' }>;
  theme: Theme;
}) {
  const config = themeConfig[theme];

  return (
    <section className={`bg-gradient-to-br px-4 py-16 ${config.heroGradient}`}>
      <div className="mx-auto max-w-4xl text-center text-white">
        <h2 className="mb-4 text-4xl font-bold">{section.heading}</h2>
        <p className="mb-8 text-lg text-gray-200">{section.description}</p>
        <button
          className={`${config.buttonStyle} rounded-lg px-8 py-3 text-lg font-semibold text-white transition`}
        >
          {section.buttonText}
        </button>
      </div>
    </section>
  );
}

/**
 * Contact section component
 */
function ContactSection({
  section,
  theme,
}: {
  section: Extract<SiteSection, { type: 'contact' }>;
  theme: Theme;
}) {
  const config = themeConfig[theme];

  return (
    <section className="bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className={`mb-12 text-center text-4xl font-bold ${config.accentColor}`}>
          {section.heading}
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          {section.phone && (
            <div className="text-center">
              <p className="mb-2 text-gray-600">Phone</p>
              <a
                href={`tel:${section.phone}`}
                className={`text-lg font-bold ${config.accentColor}`}
              >
                {section.phone}
              </a>
            </div>
          )}
          {section.email && (
            <div className="text-center">
              <p className="mb-2 text-gray-600">Email</p>
              <a
                href={`mailto:${section.email}`}
                className={`text-lg font-bold ${config.accentColor}`}
              >
                {section.email}
              </a>
            </div>
          )}
          {section.address && (
            <div className="text-center">
              <p className="mb-2 text-gray-600">Address</p>
              <p className="text-lg font-bold">{section.address}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Gallery section component
 */
function GallerySection({
  section,
  theme,
}: {
  section: Extract<SiteSection, { type: 'gallery' }>;
  theme: Theme;
}) {
  const config = themeConfig[theme];

  return (
    <section className="bg-white px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className={`mb-12 text-center text-4xl font-bold ${config.accentColor}`}>
          {section.heading}
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {section.imageUrls.map((url, idx) => (
            <div key={idx} className="overflow-hidden rounded-lg shadow">
              <Image
                src={url}
                alt={`Gallery ${idx + 1}`}
                width={400}
                height={300}
                className="h-64 w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Render a single section
 */
function renderSection(section: SiteSection, theme: Theme, key: string) {
  switch (section.type) {
    case 'hero':
      return <HeroSection key={key} section={section} theme={theme} />;
    case 'about':
      return <AboutSection key={key} section={section} theme={theme} />;
    case 'services':
      return <ServicesSection key={key} section={section} theme={theme} />;
    case 'reviews':
      return <ReviewsSection key={key} section={section} theme={theme} />;
    case 'cta':
      return <CTASection key={key} section={section} theme={theme} />;
    case 'contact':
      return <ContactSection key={key} section={section} theme={theme} />;
    case 'gallery':
      return <GallerySection key={key} section={section} theme={theme} />;
    default:
      const _exhaustive: never = section;
      return _exhaustive;
  }
}

/**
 * Site renderer component
 *
 * Takes a SiteDocument and renders it as React components
 */
export function SiteRenderer({ site, theme = 'modern' }: { site: SiteDocument; theme?: Theme }) {
  return (
    <div className="min-h-screen bg-white">
      {site.sections.map((section, idx) => renderSection(section, theme, `section-${idx}`))}
    </div>
  );
}
