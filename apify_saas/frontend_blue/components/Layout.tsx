import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, CreditCard, LogOut, Menu, X, User as UserIcon, Zap, Bookmark } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
}

const Layout: React.FC<LayoutProps> = ({ children, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Saved', href: '/saved', icon: Bookmark },
    { name: 'Billing', href: '/billing', icon: CreditCard },
  ];

  const isActive = (path: string) => {
      if (path === '/search' && location.pathname.startsWith('/results')) return true;
      return location.pathname === path;
  };

  const handleLogout = () => {
    navigate('/login');
  };

  if (['/login', '/register', '/'].includes(location.pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            <div className="flex gap-8">
              <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-xs">
                  <Zap className="w-5 h-5 text-white" fill="currentColor" />
                </div>
                <span className="ml-3 font-semibold text-lg text-gray-900 tracking-tight">AdSpy Pro</span>
              </div>
              
              <div className="hidden sm:flex sm:space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-all duration-200 self-center rounded-md ${
                      isActive(item.href)
                        ? 'border-transparent bg-gray-50 text-brand-700'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 mr-2.5 ${isActive(item.href) ? 'text-brand-600' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden sm:ml-6 sm:items-center sm:flex space-x-4">
              {user && (
                <div className="flex items-center space-x-3 bg-white pl-3 pr-1 py-1 rounded-full border border-gray-200 shadow-xs">
                  <div className="flex items-center space-x-2 mr-2">
                    <div className={`h-2 w-2 rounded-full ${user.credits > 0 ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {user.credits} <span className="text-gray-400 font-normal">credits</span>
                    </span>
                  </div>
                  <Link to="/billing" className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors">
                    Buy more
                  </Link>
                </div>
              )}

              <div className="h-4 w-px bg-gray-200 mx-2"></div>

              <div className="flex items-center space-x-3">
                <Link to="/account" className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                    <div className="h-8 w-8 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
                        {user?.name.charAt(0)}
                    </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="sm:hidden bg-white border-b border-gray-200 shadow-lg absolute w-full z-40">
            <div className="pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium ${
                    isActive(item.href)
                      ? 'bg-brand-50 border-brand-500 text-brand-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  <div className="flex items-center px-4">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 pb-4 bg-gray-50">
              <div className="flex items-center px-6">
                <div className="flex-shrink-0">
                   <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                        {user?.name.charAt(0)}
                   </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user?.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                </div>
              </div>
              <div className="mt-4 px-6 space-y-2">
                 <Link to="/billing" className="w-full flex items-center justify-between text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 shadow-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <span>Credits Available</span>
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{user?.credits}</span>
                 </Link>
                 <Link
                  to="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 w-full max-w-screen-xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;