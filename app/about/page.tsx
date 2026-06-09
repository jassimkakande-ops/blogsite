

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-orange-400 to-orange-600">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-6">About Kilax Movies</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            We&apos;re passionate movie enthusiasts dedicated to bringing you thoughtful reviews,
            engaging discussions, and insights into the world of cinema.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <span className="text-transparent bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text">
                Our Mission
              </span>
            </h2>
            <p className="text-orange-600 text-lg">
              To create a community where movie lovers can discover, discuss, and celebrate cinema
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 text-center bg-white rounded-lg shadow hover:shadow-orange-400 transition-shadow">
              <div className="h-12 w-12 text-orange-500 mx-auto mb-4 text-4xl">🎬</div>
              <h3 className="text-xl font-semibold mb-3 text-orange-700">Quality Reviews</h3>
              <p className="text-orange-600">
                In-depth, honest reviews that help you discover your next favorite film
              </p>
            </div>
            <div className="p-6 text-center bg-white rounded-lg shadow hover:shadow-orange-400 transition-shadow">
              <div className="h-12 w-12 text-orange-500 mx-auto mb-4 text-4xl">❤️</div>
              <h3 className="text-xl font-semibold mb-3 text-orange-700">Passion Driven</h3>
              <p className="text-orange-600">
                Our love for cinema drives everything we do, from reviews to recommendations
              </p>
            </div>
            <div className="p-6 text-center bg-white rounded-lg shadow hover:shadow-orange-400 transition-shadow">
              <div className="h-12 w-12 text-orange-500 mx-auto mb-4 text-4xl">👥</div>
              <h3 className="text-xl font-semibold mb-3 text-orange-700">Community Focus</h3>
              <p className="text-orange-600">
                Building a community of movie lovers who share insights and recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <span className="text-transparent bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text">
                Meet Our Team
              </span>
            </h2>
            <p className="text-orange-600">
              Passionate movie critics and cinema enthusiasts
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6 text-center bg-white rounded-lg shadow">
              <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">AJ</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-orange-700">Alex Johnson</h3>
              <p className="text-orange-500 font-medium mb-3">Lead Critic</p>
              <p className="text-orange-600">
                Specializes in sci-fi and thriller movies with 10+ years of film criticism experience.
              </p>
            </div>
            <div className="p-6 text-center bg-white rounded-lg shadow">
              <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">SW</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-orange-700">Sarah Williams</h3>
              <p className="text-orange-500 font-medium mb-3">Romance & Drama Expert</p>
              <p className="text-orange-600">
                Expert in romantic films and character-driven dramas, bringing emotional depth to reviews.
              </p>
            </div>
            <div className="p-6 text-center bg-white rounded-lg shadow">
              <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">MC</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-orange-700">Mike Chen</h3>
              <p className="text-orange-500 font-medium mb-3">Action & Adventure</p>
              <p className="text-orange-600">
                Action movie enthusiast with deep knowledge of cinematography and visual effects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">
          <span className="text-transparent bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text">
            Join Our Community
          </span>
        </h2>
        <p className="text-orange-600 mb-8 max-w-2xl mx-auto">
          Ready to explore the world of cinema with us? Subscribe to our newsletter and
          never miss our latest reviews and insights.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="/subscribe" className="px-6 py-3 rounded bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg transition">
            Subscribe Now
          </a>
          <a href="/contact" className="px-6 py-3 rounded border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-semibold text-lg transition">
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  );
} 