

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="py-16 bg-gradient-to-r from-orange-400 to-orange-600">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Get in Touch</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Have a movie recommendation, feedback, or just want to chat about cinema?
            We&apos;d love to hear from you!
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="p-8 bg-white rounded-lg shadow">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Send us a Message</h2>
              <p className="text-gray-500">
                Fill out the form below and we&apos;ll get back to you as soon as possible.
              </p>
            </div>

            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block font-medium">Name</label>
                  <input
                    id="name"
                    name="name"
                    className="block w-full rounded border border-orange-200 px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block font-medium">Email</label>
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

              <div className="space-y-2">
                <label htmlFor="subject" className="block font-medium">Subject</label>
                <input
                  id="subject"
                  name="subject"
                  className="block w-full rounded border border-orange-200 px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  placeholder="What would you like to discuss?"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="block font-medium">Message</label>
                <textarea
                  id="message"
                  name="message"
                  className="block w-full rounded border border-orange-200 px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  placeholder="Tell us more about your thoughts, suggestions, or movie recommendations..."
                  rows={6}
                  required
                />
              </div>

              <button type="submit" className="w-full px-4 py-3 rounded bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg flex items-center justify-center gap-2 transition">
                <span>✉️</span> Send Message
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Other Ways to Reach Us</h2>
              <div className="space-y-6">
                <div className="p-6 bg-white rounded-lg shadow hover:shadow-orange-400 transition-shadow">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl text-orange-500 mt-1">📧</span>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <p className="text-gray-500 mb-2">
                        Send us an email anytime
                      </p>
                      <a
                        href="mailto:hello@kilaxmovies.com"
                        className="text-orange-500 hover:underline"
                      >
                        hello@kilaxmovies.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow hover:shadow-orange-400 transition-shadow">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl text-orange-500 mt-1">💬</span>
                    <div>
                      <h3 className="font-semibold mb-1">Social Media</h3>
                      <p className="text-gray-500 mb-2">
                        Follow us for daily movie updates
                      </p>
                      <div className="flex gap-2">
                        <a href="#" className="text-orange-500 hover:underline">Twitter</a>
                        <span className="text-gray-400">•</span>
                        <a href="#" className="text-orange-500 hover:underline">Instagram</a>
                        <span className="text-gray-400">•</span>
                        <a href="#" className="text-orange-500 hover:underline">Facebook</a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow hover:shadow-orange-400 transition-shadow">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl text-orange-500 mt-1">📞</span>
                    <div>
                      <h3 className="font-semibold mb-1">Response Time</h3>
                      <p className="text-gray-500">
                        We typically respond within 24-48 hours
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">How can I request a movie review?</h4>
                  <p className="text-sm text-gray-500">
                    Simply send us a message with the movie title and why you&apos;d like us to review it.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Do you accept guest posts?</h4>
                  <p className="text-sm text-gray-500">
                    We occasionally feature guest writers. Contact us with your writing samples.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">How often do you publish new reviews?</h4>
                  <p className="text-sm text-gray-500">
                    We publish 2-3 new movie reviews every week.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}