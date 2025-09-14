import { Outlet, Link, useLocation } from 'react-router-dom';
import { Footer } from './Footer';

export default function AppShell() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <header className="no-print sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-4">
          {/* Top Row: GrowIt + Navigation + Search */}
          <div className="flex items-center justify-between mb-4">
            {/* GrowIt Brand - Left */}
            <div className="flex-1 flex justify-start">
              <div className="text-2xl font-heading font-bold text-slate-900">GrowIt</div>
            </div>
            
            {/* Navigation Menu - Center */}
            <nav className="flex space-x-1 mx-8">
              {[
                ["Dashboard", "/"],
                ["Admission", "/admission"],
                ["Doctor Slip", "/doctor-slip/select"],
                ["Operation Record", "/operation-record/select"],
                ["Nurse Handover", "/nurse-handover/select"],
                ["Patient File", "/patient-file/select"],
                ["Discharge", "/discharge/select"],
                ["Claims", "/claims/select"],
              ].map(([label, href]) => (
                <Link 
                  key={href} 
                  to={href} 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === href 
                      ? 'bg-primary-600 text-white' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            
            {/* Search Bar - Right */}
            <div className="flex-1 max-w-md flex justify-end">
              <input
                placeholder="Search patients, records..."
                className="h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-4">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
