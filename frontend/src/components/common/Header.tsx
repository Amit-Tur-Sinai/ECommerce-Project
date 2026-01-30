import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Cloud, Menu, X, User, LogOut, Settings, Moon, Sun, ChevronDown, BarChart3, Map, Calendar, FileText, DollarSign, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/clsx';

export const Header = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        moreMenuRef.current && !moreMenuRef.current.contains(target) &&
        userMenuRef.current && !userMenuRef.current.contains(target)
      ) {
        setMoreMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-16 gap-4">
          {/* Logo & About Us - Left */}
          <div className="flex justify-start items-center gap-4">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <Cloud className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">WeatherRisk</span>
            </Link>
            {/* About Us - visible to everyone */}
            <Link
              to="/about"
              className="hidden md:block text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-sm"
            >
              About Us
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center justify-center gap-3">
            {user && (
              <>
                {/* Business users ONLY see Business pages */}
                {user.role === 'Business' && (
                  <>
                    {/* Primary Navigation - Always Visible */}
                    <Link
                      to="/dashboard"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-lg"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/recommendations"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-lg"
                    >
                      Recommendations
                    </Link>
                    <Link
                      to="/analytics"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-lg"
                    >
                      Analytics
                    </Link>
                    <Link
                      to="/sensors"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-lg"
                    >
                      Sensors
                    </Link>
                    
                    {/* More Menu - Dropdown for additional pages */}
                    <div className="relative" ref={moreMenuRef}>
                      <button
                        onClick={() => {
                          setMoreMenuOpen(!moreMenuOpen);
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-lg"
                      >
                        More
                        <ChevronDown className={`w-3 h-3 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {moreMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                          <Link
                            to="/map"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setMoreMenuOpen(false)}
                          >
                            <Map className="w-4 h-4" />
                            Map
                          </Link>
                          <Link
                            to="/forecast"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setMoreMenuOpen(false)}
                          >
                            <Calendar className="w-4 h-4" />
                            Forecast
                          </Link>
                          <Link
                            to="/reports"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setMoreMenuOpen(false)}
                          >
                            <FileText className="w-4 h-4" />
                            Reports
                          </Link>
                          <Link
                            to="/savings"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setMoreMenuOpen(false)}
                          >
                            <DollarSign className="w-4 h-4" />
                            Savings
                          </Link>
                          <Link
                            to="/impact"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setMoreMenuOpen(false)}
                          >
                            <AlertTriangle className="w-4 h-4" />
                            Impact
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {/* Insurance users ONLY see Insurance pages */}
                {user.role === 'Insurance' && (
                  <>
                    <Link
                      to="/admin"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-lg"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/insurance/portfolio"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-lg"
                    >
                      Portfolio
                    </Link>
                    <Link
                      to="/insurance/claims"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-lg"
                    >
                      Claims
                    </Link>
                    <Link
                      to="/insurance/policies"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-lg"
                    >
                      Policies
                    </Link>
                    <Link
                      to="/insurance/compare"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-lg"
                    >
                      Compare
                    </Link>
                  </>
                )}
                
                {/* Admin users see Insurance pages */}
                {user.role === 'Admin' && (
                  <>
                    <Link
                      to="/admin"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-lg"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/insurance/portfolio"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-lg"
                    >
                      Portfolio
                    </Link>
                    <Link
                      to="/insurance/claims"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-lg"
                    >
                      Claims
                    </Link>
                    <Link
                      to="/insurance/policies"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-lg"
                    >
                      Policies
                    </Link>
                    <Link
                      to="/insurance/compare"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap text-lg"
                    >
                      Compare
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Theme Toggle & User Menu - Right */}
          <div className="flex items-center justify-end gap-2 flex-shrink-0">
            {/* Dark Mode Toggle */}
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleTheme();
              }}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
              type="button"
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <User className="w-5 h-5 flex-shrink-0" />
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button & Theme Toggle - Right */}
          <div className="md:hidden flex items-center justify-end gap-2 col-start-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleTheme();
              }}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle dark mode"
              type="button"
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 dark:text-gray-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/about"
              className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </Link>
            {user ? (
              <>
                {/* Business users ONLY see Business pages */}
                {user.role === 'Business' && (
                  <>
                    <Link
                      to="/dashboard"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/recommendations"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Recommendations
                    </Link>
                    <Link
                      to="/analytics"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Analytics
                    </Link>
                    <Link
                      to="/sensors"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sensors
                    </Link>
                    <Link
                      to="/map"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Map
                    </Link>
                    <Link
                      to="/forecast"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Forecast
                    </Link>
                    <Link
                      to="/reports"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Reports
                    </Link>
                    <Link
                      to="/savings"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Savings
                    </Link>
                    <Link
                      to="/impact"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Impact
                    </Link>
                  </>
                )}
                
                {/* Insurance users ONLY see Insurance pages */}
                {user.role === 'Insurance' && (
                  <>
                    <Link
                      to="/admin"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/insurance/portfolio"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Portfolio
                    </Link>
                    <Link
                      to="/insurance/claims"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Claims
                    </Link>
                    <Link
                      to="/insurance/policies"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Policies
                    </Link>
                    <Link
                      to="/insurance/compare"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Compare
                    </Link>
                  </>
                )}
                
                {/* Admin users see Insurance pages */}
                {user.role === 'Admin' && (
                  <>
                    <Link
                      to="/admin"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/insurance/portfolio"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Portfolio
                    </Link>
                    <Link
                      to="/insurance/claims"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Claims
                    </Link>
                    <Link
                      to="/insurance/policies"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Policies
                    </Link>
                    <Link
                      to="/insurance/compare"
                      className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Compare
                    </Link>
                  </>
                )}
                
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};
