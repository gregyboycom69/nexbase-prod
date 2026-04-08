import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-primary-600">NexBase</h1>
              <div className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">
                  Features
                </a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">
                  Pricing
                </a>
                <Link href="/templates" className="text-gray-600 hover:text-gray-900 font-medium">
                  Templates
                </Link>
                <a href="#" className="text-gray-600 hover:text-gray-900 font-medium">
                  Docs
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Build Your Own CRM
            <br />
            <span className="text-primary-600">Without Code</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Drag, drop, and publish. Your clients get a professional app in minutes.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 font-medium text-lg transition-colors shadow-lg"
            >
              Start Free Trial
            </Link>
            <Link
              href="/templates"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg hover:bg-gray-50 font-medium text-lg border-2 border-primary-600 transition-colors"
            >
              See Templates
            </Link>
          </div>
          {/* Hero Image Placeholder */}
          <div className="mt-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto border-4 border-white">
            <div className="bg-white rounded-lg shadow-inner p-6 text-center">
              <div className="text-6xl mb-4">🚀</div>
              <p className="text-gray-600 font-medium">
                Visual Form Designer • Real Database • One-Click Publish
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Build Custom CRMs
            </h2>
            <p className="text-xl text-gray-600">
              Professional tools without the complexity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Drag & Drop Designer */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Drag & Drop Designer
              </h3>
              <p className="text-gray-600">
                Intuitive visual editor with 25+ form controls. Build complex forms in minutes without writing a single line of code.
              </p>
            </div>

            {/* Feature 2: MS Access Style Controls */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                MS Access Style Controls
              </h3>
              <p className="text-gray-600">
                Familiar controls like dropdown lists, combo boxes, date pickers, and data grids. Perfect for users coming from Access or Excel.
              </p>
            </div>

            {/* Feature 3: Real Database */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Real Database (Supabase)
              </h3>
              <p className="text-gray-600">
                Your data is stored securely in a real PostgreSQL database with automatic backups, row-level security, and enterprise-grade reliability.
              </p>
            </div>

            {/* Feature 4: Publish in One Click */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Publish in One Click
              </h3>
              <p className="text-gray-600">
                Deploy your application instantly with a single click. Your clients get immediate access to a professional, fully-functional app.
              </p>
            </div>

            {/* Feature 5: Client Branding */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Client Branding
              </h3>
              <p className="text-gray-600">
                Customize colors, logos, and app names. White-label options available on Agency plans for a completely branded experience.
              </p>
            </div>

            {/* Feature 6: Macro Automation */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Macro Automation
              </h3>
              <p className="text-gray-600">
                Built-in macro system for automating workflows. Set field values, trigger actions, and create dynamic forms without coding.
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="py-16 bg-gradient-to-br from-primary-50 to-white rounded-2xl my-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Businesses Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers are saying
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xl">
                  JD
                </div>
                <div className="ml-3">
                  <div className="font-bold text-gray-900">John Davis</div>
                  <div className="text-sm text-gray-600">Golf Club Manager</div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "NexBase transformed how we manage our golf club. Built our entire membership system in under 2 hours!"
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xl">
                  SM
                </div>
                <div className="ml-3">
                  <div className="font-bold text-gray-900">Sarah Mitchell</div>
                  <div className="text-sm text-gray-600">Agency Owner</div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Finally, a no-code tool that doesn't limit what I can build. My clients love their custom CRMs."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xl">
                  MR
                </div>
                <div className="ml-3">
                  <div className="font-bold text-gray-900">Michael Roberts</div>
                  <div className="text-sm text-gray-600">Small Business Owner</div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Switched from Excel to NexBase. My team actually uses it now, and our data is finally organized!"
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200 hover:border-primary-500 transition-colors">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-primary-600">€19</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">1 Workspace</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">5 Pages per workspace</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">1,000 data rows/month</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Email support</span>
                </li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg hover:bg-primary-700 font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Builder Plan */}
            <div className="bg-white rounded-lg shadow-xl p-8 border-2 border-primary-600 relative transform md:scale-105">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Builder</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-primary-600">€49</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">10 Workspaces</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Unlimited pages</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">50,000 data rows/month</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Priority support</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Custom branding</span>
                </li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg hover:bg-primary-700 font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Agency Plan */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200 hover:border-primary-500 transition-colors">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Agency</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-primary-600">€149</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Unlimited workspaces</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Unlimited pages</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Unlimited data rows</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">White-label (Remove branding)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">API access</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">24/7 support</span>
                </li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg hover:bg-primary-700 font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl text-center text-white my-16 px-8">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Build Your Custom CRM?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of businesses who have already transformed their operations with NexBase. Start your free trial today—no credit card required.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg hover:bg-gray-100 font-medium text-lg transition-colors shadow-lg"
            >
              Start Free Trial
            </Link>
            <Link
              href="/templates"
              className="bg-primary-500 text-white px-8 py-3 rounded-lg hover:bg-primary-400 font-medium text-lg border-2 border-white transition-colors"
            >
              Browse Templates
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <h3 className="text-lg font-bold text-primary-600 mb-4">NexBase</h3>
              <p className="text-gray-600 text-sm">
                Build custom CRM applications without code. Professional tools for everyone.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-gray-600 hover:text-primary-600 text-sm">
                    Features
                  </a>
                </li>
                <li>
                  <Link href="/pricing" className="text-gray-600 hover:text-primary-600 text-sm">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/templates" className="text-gray-600 hover:text-primary-600 text-sm">
                    Templates
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-primary-600 text-sm">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-primary-600 text-sm">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-primary-600 text-sm">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="mailto:support@nexbase.app" className="text-gray-600 hover:text-primary-600 text-sm">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-primary-600 text-sm">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-primary-600 text-sm">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-primary-600 text-sm">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-600 text-sm">
              © 2026 NexBase. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
