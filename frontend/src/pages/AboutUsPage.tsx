import { Users, Cloud, Crown } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface ScrollSectionProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight';
}

const ScrollSection = ({ children, delay = 0, direction = 'fadeUp' }: ScrollSectionProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: true });

  const getAnimationClass = () => {
    const baseClass = 'transition-all duration-1000 ease-out';
    if (!isVisible) {
      switch (direction) {
        case 'fadeUp':
          return `${baseClass} opacity-0 translate-y-10`;
        case 'fadeIn':
          return `${baseClass} opacity-0`;
        case 'slideLeft':
          return `${baseClass} opacity-0 -translate-x-10`;
        case 'slideRight':
          return `${baseClass} opacity-0 translate-x-10`;
        default:
          return `${baseClass} opacity-0 translate-y-10`;
      }
    }
    return `${baseClass} opacity-100 translate-y-0 translate-x-0`;
  };

  return (
    <div
      ref={ref}
      className={getAnimationClass()}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export const AboutUsPage = () => {
  const founders = [
    {
      name: 'Amit Tur Sinai',
    },
    {
      name: 'Neri Nigberg',
    },
    {
      name: 'Nitzan Melchior',
    },
    {
      name: 'Yael Tokolovsky',
    },
    {
      name: 'Yovel Hatan',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-6">
              <Users className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              About Us
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              We're a team of passionate developers building innovative solutions
              to help businesses protect themselves from weather-related risks.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollSection direction="fadeUp">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                WeatherRisk was born from the need to help businesses make
                data-driven decisions about weather-related risks. We combine
                advanced machine learning models with real-time weather data to
                provide actionable insights that protect businesses and their
                operations.
              </p>
            </div>
          </ScrollSection>

          <ScrollSection direction="fadeUp" delay={200}>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Our Technology
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                Our platform leverages cutting-edge AI and machine learning
                algorithms to analyze weather patterns and predict risks specific
                to different business types. From butcher shops to wineries, we
                provide tailored recommendations that help businesses stay compliant
                and protected.
              </p>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                <Cloud className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Founders Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollSection direction="fadeUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Founders
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Meet the team behind WeatherRisk
              </p>
            </div>
          </ScrollSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            {founders.map((founder, index) => (
              <ScrollSection
                key={index}
                direction="fadeUp"
                delay={index * 100}
              >
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      <Users className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-yellow-400 dark:bg-yellow-500 rounded-full p-1.5 shadow-md">
                      <Crown className="w-4 h-4 text-yellow-900 dark:text-yellow-950" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {founder.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Co-Founder
                  </p>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollSection direction="fadeUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Values
              </h2>
            </div>
          </ScrollSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <ScrollSection direction="slideLeft" delay={0}>
              <div className="text-center p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Innovation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We continuously push the boundaries of what's possible with AI
                  and machine learning to deliver cutting-edge solutions.
                </p>
              </div>
            </ScrollSection>

            <ScrollSection direction="fadeUp" delay={200}>
              <div className="text-center p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Reliability
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Businesses depend on us for accurate predictions and timely
                  alerts. We take that responsibility seriously.
                </p>
              </div>
            </ScrollSection>

            <ScrollSection direction="slideRight" delay={400}>
              <div className="text-center p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Customer Focus
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Every feature we build is designed with our customers' needs in
                  mind, helping them protect what matters most.
                </p>
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>
    </div>
  );
};
