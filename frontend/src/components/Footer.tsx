import { Icon } from './Icons';

export function Footer() {
  return (
    <footer className="bg-white text-slate-700 py-2 mt-8 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-1">
            <h3 className="text-xs font-medium text-slate-600 mb-1">
              GrowIt – "The Future of Medicine. Now."
            </h3>
          </div>
          
          <div className="space-y-0.5 text-slate-500">
            <p className="flex items-center justify-center space-x-1 text-xs">
              <Icon name="Globe" size={10} />
              <span>www.growit7.com</span>
            </p>
            
            <p className="flex items-center justify-center space-x-1 text-xs">
              <Icon name="Home" size={10} />
              <span>Head Office: 361, 23rd Main Road, Indra Nagar, Bangalore</span>
            </p>
            
            <p className="flex items-center justify-center space-x-1 text-xs">
              <Icon name="User" size={10} />
              <span>info@growit7.com</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
