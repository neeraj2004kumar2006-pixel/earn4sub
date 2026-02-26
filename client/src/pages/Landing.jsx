// pages/Landing.jsx - Public landing page for Sub4Earn
import { Link } from 'react-router-dom';
import { Youtube, Wallet, ShieldCheck, IndianRupee, ArrowRight, Star, Users, CheckCircle } from 'lucide-react';

const steps = [
  { icon: Users,       color: 'bg-purple-100 text-purple-600', title: 'Create Free Account', desc: 'Sign up with your email. No fees, no hidden charges.' },
  { icon: Youtube,     color: 'bg-red-100 text-red-600',       title: 'Pick a YouTube Task', desc: 'Browse tasks, visit the channel, and subscribe to earn.' },
  { icon: CheckCircle, color: 'bg-blue-100 text-blue-600',     title: 'Upload Proof Screenshot', desc: 'Screenshot your subscription and upload as proof.' },
  { icon: IndianRupee, color: 'bg-green-100 text-green-600',   title: 'Get Paid to UPI', desc: 'Admin reviews and credits your wallet. Withdraw via UPI.' },
];

const features = [
  { icon: '🔒', title: 'Secure & Trusted',   desc: 'KYC verified withdrawals. Your data is safe.' },
  { icon: '⚡', title: 'Fast Payouts',        desc: 'Withdrawals processed within 24-48 hours.' },
  { icon: '📱', title: 'Mobile Friendly',     desc: 'Designed for smartphones. Works on any device.' },
  { icon: '🎁', title: 'Referral Bonus',      desc: 'Invite friends and earn bonus on every signup.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-5 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">S4E</span>
          </div>
          <span className="font-bold text-gray-900 text-xl">Sub4Earn</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">Login</Link>
          <Link to="/signup" className="btn-primary text-sm py-2 px-4">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-5 py-16 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-full px-4 py-1.5 text-purple-700 text-sm font-medium mb-6">
          <Star size={14} fill="currentColor" /> India's #1 Subscribe-to-Earn Platform
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
          Earn Real Money by
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600"> Subscribing</span>
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
          Complete simple YouTube subscribe tasks, upload proof, and get paid directly to your UPI ID. Free to join. No investment needed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/signup" className="btn-primary flex items-center justify-center gap-2">
            Start Earning Now <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="btn-secondary text-center">Login to Dashboard</Link>
        </div>
        {/* Stats */}
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-md mx-auto">
          {[['₹50+', 'Min. Payout'], ['1000+', 'Active Users'], ['8+', 'Live Tasks']].map(([val, label]) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-purple-700">{val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16 px-5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">How Sub4Earn Works</h2>
          <p className="text-center text-gray-500 mb-10">Four simple steps to start earning</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div key={i} className="card text-center">
                <div className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center mx-auto mb-3`}>
                  <s.icon size={22} />
                </div>
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">{i+1}</div>
                <h3 className="font-semibold text-gray-800 mb-1 text-sm">{s.title}</h3>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">Why Choose Sub4Earn?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <div key={i} className="card flex items-start gap-4">
                <span className="text-3xl">{f.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-purple-600 to-violet-600 py-14 px-5 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to Start Earning?</h2>
        <p className="text-purple-100 mb-6">Join thousands of users earning with Sub4Earn today.</p>
        <Link to="/signup" className="inline-flex items-center gap-2 bg-white text-purple-700 font-bold py-3 px-7 rounded-xl shadow-lg hover:bg-purple-50 transition-all active:scale-95">
          Create Free Account <ArrowRight size={16} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-100">
        © {new Date().getFullYear()} Sub4Earn · All rights reserved
      </footer>
    </div>
  );
}
