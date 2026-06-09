import Link from 'next/link';


const categories = [
  {
    name: 'Action',
    icon: '⚡',
    description: 'High-octane thrills, chase scenes, and explosive adventures',
    count: 45,
    color: 'text-orange-500',
  },
  {
    name: 'Romance',
    icon: '❤️',
    description: 'Love stories that touch the heart and soul',
    count: 32,
    color: 'text-orange-500',
  },
  {
    name: 'Sci-Fi',
    icon: '✨',
    description: 'Futuristic tales and science fiction adventures',
    count: 28,
    color: 'text-orange-500',
  },
  {
    name: 'Comedy',
    icon: '😂',
    description: 'Laugh-out-loud moments and feel-good entertainment',
    count: 38,
    color: 'text-orange-500',
  },
  {
    name: 'Horror',
    icon: '👻',
    description: 'Spine-chilling thrillers and supernatural scares',
    count: 22,
    color: 'text-orange-500',
  },
  {
    name: 'Drama',
    icon: '🎬',
    description: 'Compelling character studies and emotional journeys',
    count: 54,
    color: 'text-orange-500',
  },
  {
    name: 'International',
    icon: '🌐',
    description: 'World cinema from diverse cultures and countries',
    count: 26,
    color: 'text-orange-500',
  },
  {
    name: 'Awards',
    icon: '🏆',
    description: 'Oscar winners and critically acclaimed masterpieces',
    count: 19,
    color: 'text-orange-500',
  },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="py-16 bg-gradient-to-r from-orange-400 to-orange-600">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Movie Categories</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Explore our extensive collection of movie reviews organized by genre.
            Find your favorite type of films and discover new favorites.
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.name}
              className="p-6 text-center bg-white rounded-lg shadow hover:shadow-orange-400 transition-all duration-300 group cursor-pointer"
            >
              <div className="mb-4">
                <span className={`text-5xl mx-auto block ${category.color} group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-orange-700 group-hover:text-orange-500 transition-colors">
                {category.name}
              </h3>
              <p className="text-orange-600 text-sm mb-4">
                {category.description}
              </p>
              <div className="text-2xl font-bold text-orange-500 mb-4">
                {category.count}
              </div>
              <p className="text-xs text-orange-500 mb-4">
                {category.count} reviews available
              </p>
              <Link
                href={`/blog?category=${category.name.toLowerCase()}`}
                className="block w-full px-4 py-2 border border-orange-500 text-orange-500 rounded hover:bg-orange-500 hover:text-white transition-colors"
              >
                Explore {category.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Category */}
      <section className="py-16 bg-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <span className="text-transparent bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text">
                This Month&apos;s Featured Category
              </span>
            </h2>
            <p className="text-orange-600">
              Spotlight on the most talked-about genre this month
            </p>
          </div>

          <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl text-orange-500">✨</span>
                  <h3 className="text-2xl font-bold text-orange-700">Sci-Fi Movies</h3>
                </div>
                <p className="text-orange-600 mb-6">
                  This month we&apos;re diving deep into the world of science fiction cinema.
                  From classic space operas to modern AI thrillers, discover why sci-fi
                  continues to captivate audiences and push the boundaries of storytelling.
                </p>
                <div className="flex gap-4">
                  <Link
                    href="/blog?category=sci-fi"
                    className="px-4 py-2 rounded bg-orange-500 hover:bg-orange-600 text-white font-semibold transition"
                  >
                    Read Sci-Fi Reviews
                  </Link>
                  <Link
                    href="/blog"
                    className="px-4 py-2 rounded border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-semibold transition"
                  >
                    All Categories
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg p-4 text-white text-center">
                  <div className="text-2xl font-bold">28</div>
                  <div className="text-sm opacity-90">Sci-Fi Reviews</div>
                </div>
                <div className="bg-gradient-to-r from-orange-600 to-orange-400 rounded-lg p-4 text-white text-center">
                  <div className="text-2xl font-bold">4.8</div>
                  <div className="text-sm opacity-90">Avg Rating</div>
                </div>
                <div className="bg-orange-400 rounded-lg p-4 text-white text-center">
                  <div className="text-2xl font-bold">15</div>
                  <div className="text-sm opacity-90">New This Month</div>
                </div>
                <div className="bg-orange-600 rounded-lg p-4 text-white text-center">
                  <div className="text-2xl font-bold">92%</div>
                  <div className="text-sm opacity-90">Reader Approval</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">
          <span className="text-transparent bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text">
            Can&apos;t Find What You&apos;re Looking For?
          </span>
        </h2>
        <p className="text-orange-600 mb-8 max-w-2xl mx-auto">
          Have a specific movie or genre you&apos;d like us to review?
          Get in touch and let us know what you&apos;d like to see covered next.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/contact"
            className="px-6 py-3 rounded bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg transition"
          >
            Request a Review
          </Link>
          <Link
            href="/blog"
            className="px-6 py-3 rounded border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-semibold text-lg transition"
          >
            Browse All Posts
          </Link>
        </div>
      </section>
    </div>
  );
} 