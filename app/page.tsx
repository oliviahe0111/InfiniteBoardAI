export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <svg
                className="h-9 w-9 text-primary"
                fill="none"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"
                  fill="currentColor"
                />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900">
                InfiniteBoardAI
              </h1>
            </div>
            <div className="flex items-center">
              <a
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-semibold py-2 px-5 rounded-full transition-colors"
                href="/login"
              >
                Log in
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex items-center">
        <div className="relative w-full">
          <div className="absolute inset-0 background-gradient"></div>
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center py-40 md:py-56 lg:py-64">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Spark Ideas, Visually. <br /> AI Conversations on an Infinite
              Canvas.
            </h1>
            <p className="mt-8 max-w-2xl mx-auto text-lg text-gray-700">
              Dive into a new era of brainstorming. InfiniteBoardAI merges
              AI-driven dialogue with a limitless visual workspace to transform
              your ideas into actionable insights.
            </p>
            <div className="mt-12">
              <a
                className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-10 rounded-full text-lg transition-transform transform hover:scale-105 shadow-lg shadow-primary/30"
                href="/app"
              >
                Try Infinite Board
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Demo Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
              See It In Action
            </h2>
            <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
              Watch how InfiniteBoardAI helps you explore ideas through
              interactive AI conversations
            </p>
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <div
                style={{
                  position: "relative",
                  paddingBottom: "calc(68.626010286554% + 41px)",
                  height: 0,
                  width: "100%",
                }}
              >
                <iframe
                  src="https://demo.arcade.software/xOY5G7NZOH4K251Ju9I4?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true"
                  title="Ask Follow-Up Questions and Explore AI Responses on the Demo Board"
                  frameBorder="0"
                  loading="lazy"
                  allowFullScreen
                  allow="clipboard-write"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    colorScheme: "light",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2025 InfiniteBoardAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
