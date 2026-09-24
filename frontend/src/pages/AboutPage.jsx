import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-yellow-600/20">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <span className="inline-block text-sm tracking-[0.3em] uppercase text-yellow-700 font-semibold mb-4">
            Since Idea to Impression
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-black mb-4">
            About <span className="text-yellow-600">Namo Prints</span>
          </h1>
          <p className="max-w-2xl mx-auto text-gray-600 text-lg leading-relaxed">
            We turn your ideas into premium printed reality — precision,
            quality, and creativity in every single print.
          </p>
        </div>
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl" />
      </section>

      {/* Story */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold text-black mb-4">
            Our <span className="text-yellow-600">Story</span>
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Namo Prints was founded with a simple mission — to make high
            quality, fully customizable printing accessible to everyone.
            From business cards to custom apparel, we combine modern
            technology with old-school craftsmanship to deliver prints
            that truly stand out.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Every order, big or small, is handled with the same attention
            to detail and passion for excellence that built our reputation
            in the printing industry.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl bg-black shadow-xl">
          <ul className="divide-y divide-white/10">
            {[
              ['10+', 'Years of Experience'],
              ['5000+', 'Happy Customers'],
              ['100%', 'Quality Guaranteed'],
            ].map(([num, label]) => (
              <li
                key={label}
                className="flex items-center justify-between gap-6 px-8 py-7 sm:px-10 sm:py-8"
              >
                <span className="text-left text-base font-medium text-white/85 sm:text-lg">
                  {label}
                </span>
                <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl">
                  {num}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gradient-to-b from-white to-yellow-50 border-y border-yellow-600/20">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-black text-center mb-10">
            Why Choose <span className="text-yellow-600">Us</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                title: 'Premium Quality',
                desc: 'Top-grade materials and printing technology for a flawless finish every time.',
              },
              {
                title: 'Fast Turnaround',
                desc: 'Quick production and delivery without ever compromising on quality.',
              },
              {
                title: 'Custom Designs',
                desc: 'Fully personalized prints tailored to your exact vision and brand.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-yellow-600/10 hover:shadow-lg hover:border-yellow-600/40 transition"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
                  <span className="w-3 h-3 rounded-full bg-yellow-600" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-3">
          Ready to bring your idea to print?
        </h2>
        <p className="text-gray-600 mb-6">
          Get in touch with our team today and let's create something great.
        </p>
        
         <Link to="/contact"
          className="inline-block bg-black text-yellow-500 font-semibold px-8 py-3 rounded-full hover:bg-yellow-600 hover:text-black transition"
        >
          Contact Us
        </Link>
      </section>
    </div>
  )
}