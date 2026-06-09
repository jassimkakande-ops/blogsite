import Footer from '@/components/Footer';

export default function SubscribePage() {
  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="py-20 bg-gradient-to-r from-orange-400 to-orange-600">
        <div className="container mx-auto px-4 text-center">
          <div className="h-16 w-16 text-white mx-auto mb-6 text-6xl">📧</div>
          <h1 className="text-4xl font-bold text-white mb-4">Subscribe to Kilax Movies</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Join thousands of movie lovers and get the latest reviews, recommendations,
            and cinema insights delivered straight to your inbox.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Subscribe?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Get exclusive access to premium content and be the first to know about the latest movies
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-6 text-center bg-white rounded-lg shadow hover:shadow-orange-400 transition-shadow">
            <div className="h-8 w-8 text-orange-500 mx-auto mb-3 text-3xl">⭐</div>
            <h3 className="font-semibold mb-2">Exclusive Reviews</h3>
            <p className="text-sm text-gray-500">
              Get early access to our in-depth movie reviews before they&apos;re published
            </p>
          </div>
          <div className="p-6 text-center bg-white rounded-lg shadow hover:shadow-orange-400 transition-shadow">
            <div className="h-8 w-8 text-orange-500 mx-auto mb-3 text-3xl">🔔</div>
            <h3 className="font-semibold mb-2">Weekly Roundup</h3>
            <p className="text-sm text-gray-500">
              Curated weekly newsletter with the best movies to watch
            </p>
          </div>
          <div className="p-6 text-center bg-white rounded-lg shadow hover:shadow-orange-400 transition-shadow">
            <div className="h-8 w-8 text-orange-500 mx-auto mb-3 text-3xl">⏰</div>
            <h3 className="font-semibold mb-2">No Spam</h3>
            <p className="text-sm text-gray-500">
              Quality over quantity - only valuable content, no spam
            </p>
          </div>
          <div className="p-6 text-center bg-white rounded-lg shadow hover:shadow-orange-400 transition-shadow">
            <div className="h-8 w-8 text-orange-500 mx-auto mb-3 text-3xl">📧</div>
            <h3 className="font-semibold mb-2">Personalized</h3>
            <p className="text-sm text-gray-500">
              Customized recommendations based on your movie preferences
            </p>
          </div>
        </div>
      </section>

      {/* Subscription Form */}
      <section className="py-16 bg-orange-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Join Our Community</h2>
              <p className="text-gray-500">
                Subscribe now and become part of the Kilax Movies family
              </p>
            </div>

            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block font-medium">First Name</label>
                  <input
                    id="name"
                    name="name"
                    className="block w-full rounded border border-orange-200 px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    placeholder="Your first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block font-medium">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="block w-full rounded border border-orange-200 px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-base font-semibold">What would you like to receive?</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="reviews" name="reviews" defaultChecked className="accent-orange-500 w-4 h-4" />
                    <label htmlFor="reviews" className="text-sm">
                      <span className="font-medium">Movie Reviews</span> - Our latest in-depth movie reviews and ratings
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="recommendations" name="recommendations" defaultChecked className="accent-orange-500 w-4 h-4" />
                    <label htmlFor="recommendations" className="text-sm">
                      <span className="font-medium">Recommendations</span> - Personalized movie suggestions based on your taste
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="news" name="news" className="accent-orange-500 w-4 h-4" />
                    <label htmlFor="news" className="text-sm">
                      <span className="font-medium">Movie News</span> - Latest updates from the film industry
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="interviews" name="interviews" className="accent-orange-500 w-4 h-4" />
                    <label htmlFor="interviews" className="text-sm">
                      <span className="font-medium">Interviews</span> - Exclusive interviews with directors and actors
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-orange-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500">
                  🎬 <strong>Free Forever:</strong> Our newsletter is completely free.
                  You can unsubscribe at any time with one click.
                </p>
              </div>

              <button type="submit" className="w-full px-4 py-3 rounded bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg transition">
                Subscribe to Newsletter
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-xs text-gray-500">
                By subscribing, you agree to our{' '}
                <a href="/privacy-policy" className="text-orange-500 hover:underline">
                  Privacy Policy
                </a>
                . You can unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      {/* (section removed) */}
      
      <Footer />
    </div>
  );
} 