'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PlacesAutocompleteResult } from '@/lib/adapters/places';

/**
 * Onboarding flow
 *
 * Step 1: Search for business
 * Step 2: Confirm business details
 * Step 3: Generate site content
 * Step 4: Preview & publish
 */

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<PlacesAutocompleteResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlacesAutocompleteResult | null>(null);
  const [publishedUrl, setPublishedUrl] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/import/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Search failed');
        return;
      }

      if (data.results.length === 0) {
        setError('No businesses found. Try a different name.');
        return;
      }

      setSearchResults(data.results);
      setSelectedPlace(data.results[0]);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPlace) {
      setError('No business selected');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // TODO: Get tenantId from session/auth context
      const tenantId = '00000000-0000-0000-0000-000000000000';

      const res = await fetch(`/api/import/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: selectedPlace.placeId,
          tenantId,
          theme: 'modern',
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Generation failed');
        return;
      }

      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedPlace) return;

    setIsLoading(true);
    setError('');

    try {
      // TODO: Call publish API
      const slug = selectedPlace.name.toLowerCase().replace(/\s+/g, '-').slice(0, 50);
      setPublishedUrl(`http://${slug}.lvh.me:3000`);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="mb-4 flex justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`mx-1 h-1 flex-1 rounded-full transition ${
                  s <= step ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-300">
            Step {step} of 4: {step === 1 && 'Find Your Business'}
            {step === 2 && 'Confirm Details'}
            {step === 3 && 'Generate Content'}
            {step === 4 && 'Publish'}
          </p>
        </div>

        {/* Content */}
        <div className="rounded-lg bg-white p-8 shadow-xl">
          {/* Step 1: Search */}
          {step === 1 && (
            <div>
              <h1 className="mb-2 text-3xl font-bold text-slate-900">Let&apos;s Get You Online</h1>
              <p className="mb-8 text-gray-600">
                We&apos;ll find your business details and create a beautiful website in minutes.
              </p>

              <form onSubmit={handleSearch}>
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Fade Factory Barbershop"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-600"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Try searching for your exact business name on Google Maps
                  </p>
                </div>

                {error && (
                  <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Confirm */}
          {step === 2 && (
            <div>
              <h1 className="mb-2 text-3xl font-bold text-slate-900">Found Your Business!</h1>
              <p className="mb-8 text-gray-600">
                We found your business on Google Maps. Select one to continue.
              </p>

              <div className="mb-8 space-y-3">
                {searchResults.map((result) => (
                  <button
                    key={result.placeId}
                    onClick={() => setSelectedPlace(result)}
                    className={`w-full rounded-lg border-2 p-4 text-left transition ${
                      selectedPlace?.placeId === result.placeId
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <h3 className="font-bold text-slate-900">{result.name}</h3>
                    <p className="text-sm text-gray-600">{result.description}</p>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setStep(1);
                    setError('');
                  }}
                  className="flex-1 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !selectedPlace}
                  className="flex-1 rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isLoading ? 'Generating...' : 'Generate Site'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div>
              <h1 className="mb-2 text-3xl font-bold text-slate-900">Your Site is Ready!</h1>
              <p className="mb-8 text-gray-600">
                We&apos;ve created a professional website for your business. Click
                &quot;Publish&quot; to go live immediately.
              </p>

              <div className="mb-8 flex h-96 items-center justify-center rounded-lg border border-gray-300 bg-gray-50 p-6">
                <div className="text-center text-gray-500">
                  <p className="mb-4">Site preview ready!</p>
                  <p className="text-sm">Visit the published site to see the full design.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isLoading}
                  className="flex-1 rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isLoading ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center">
              <div className="mb-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <span className="text-3xl">✓</span>
                </div>
              </div>
              <h1 className="mb-2 text-3xl font-bold text-slate-900">You&apos;re Live!</h1>
              <p className="mb-8 text-gray-600">
                Your website is now live at{' '}
                <span className="font-mono font-bold text-blue-600">{publishedUrl}</span>
              </p>

              <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
                <h3 className="mb-3 font-bold text-slate-900">What&apos;s Next?</h3>
                <ul className="space-y-2 text-left text-sm text-gray-600">
                  <li>✓ Share your website link with customers</li>
                  <li>→ Set up your services and availability</li>
                  <li>→ Connect your payment method</li>
                  <li>→ Enable online booking</li>
                </ul>
              </div>

              <Link
                href="/dashboard"
                className="block w-full rounded-lg bg-blue-600 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
              >
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
