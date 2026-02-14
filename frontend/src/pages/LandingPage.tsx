import { Link } from 'react-router-dom';
import { Cloud, Shield, TrendingUp, AlertTriangle } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Protect Your Business from
              <span className="text-primary-600 dark:text-primary-400"> Weather Risks</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Get AI-powered weather risk assessments and actionable recommendations
              tailored to your business type and location.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-primary-600 dark:bg-primary-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-primary-600 dark:border-primary-500 hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Why Choose WeatherRisk?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Cloud className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Accurate Predictions
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Powered by machine learning models trained on historical weather data
                to provide accurate risk assessments.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Business-Specific Advice
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get recommendations tailored to your industry - whether you run a
                butcher shop, winery, or other weather-sensitive business.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Proactive Alerts
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Stay ahead of weather risks with early warnings and actionable
                recommendations to protect your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Protect Your Business?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join businesses that trust WeatherRisk for weather risk management.
          </p>
          <Link
            to="/register"
            className="inline-block bg-primary-600 dark:bg-primary-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
};
