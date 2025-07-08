import React from 'react';
import * as Icons from 'lucide-react';
import { AccessibilityOptions } from './AccessibilityOptions';
import { theme } from '../theme';

// Button Component
export const Button = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  className = '', 
  icon: Icon, 
  type = 'button', 
  disabled = false 
}) => {
  // Base classes for all buttons - neumorphic style
  const baseClasses = "flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 focus:outline-none";
  
  // Variant-specific classes based on our new design system
  const variantClasses = {
    primary: "bg-[#59569D] hover:bg-opacity-90 text-white shadow-md hover:shadow-lg transform hover:-translate-y-1 active:shadow-inner active:translate-y-0",
    secondary: "bg-white hover:bg-opacity-95 text-[#59569D] border border-[#E0E0E5] shadow-md hover:shadow-lg transform hover:-translate-y-1 active:shadow-inner active:translate-y-0",
    success: "bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-1 active:shadow-inner active:translate-y-0",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-1 active:shadow-inner active:translate-y-0",
    outline: "bg-transparent border-2 border-[#59569D] text-[#59569D] hover:bg-opacity-10 shadow-md hover:shadow-lg transform hover:-translate-y-1 active:shadow-inner active:translate-y-0",
    glass: "backdrop-filter backdrop-blur-xl bg-opacity-50 bg-[#2C2B4B] text-white shadow-md hover:shadow-lg transform hover:-translate-y-1 active:shadow-inner active:translate-y-0",
    link: "text-[#59569D] hover:text-opacity-80 underline p-0 hover:no-underline",
    icon: "bg-white text-[#59569D] rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-1 active:shadow-inner active:translate-y-0",
    custom: "" // Empty string to allow custom styling via className
  };
  
  // Size classes - adjusted for neumorphic style
  const sizeClasses = variant === 'link' ? "" : variant === 'icon' ? "" : "px-6 py-3";
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant] || ''} ${variant !== 'custom' && variant !== 'icon' ? sizeClasses : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: "600",
        fontSize: "0.85rem",
      }}
    >
      {Icon && <Icon className={`${variant === 'icon' ? 'w-5 h-5' : 'w-4 h-4'}`} />}
      {variant !== 'icon' && children}
    </button>
  );
};

// Input Field Component
export const InputField = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  name, 
  required = false,
  className = ''
}) => {
  return (
    <div className={`mb-5 ${className}`}>
      <label className="block text-[#2C2B4B] text-sm font-medium mb-2" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        required={required}
        className="w-full px-4 py-3 bg-white border border-[#E0E0E5] rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#59569D] focus:border-[#59569D] transition-all duration-300"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "0.9rem"
        }}
      />
    </div>
  );
};

// Textarea Field Component
export const TextareaField = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  name, 
  required = false, 
  rows = 3,
  className = ''
}) => {
  return (
    <div className={`mb-5 ${className}`}>
      <label className="block text-[#2C2B4B] text-sm font-medium mb-2" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        required={required}
        rows={rows}
        className="w-full px-4 py-3 bg-white border border-[#E0E0E5] rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#59569D] focus:border-[#59569D] transition-all duration-300"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "0.9rem"
        }}
      />
    </div>
  );
};

// Select Field Component
export const SelectField = ({ 
  label, 
  value, 
  onChange, 
  name, 
  required = false, 
  children,
  className = ''
}) => {
  return (
    <div className={`mb-5 ${className}`}>
      <label className="block text-[#2C2B4B] text-sm font-medium mb-2" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        name={name}
        required={required}
        className="w-full px-4 py-3 bg-white border border-[#E0E0E5] rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#59569D] focus:border-[#59569D] transition-all duration-300 appearance-none"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "0.9rem",
          backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2359569D%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.75rem center",
          backgroundSize: "1rem",
          paddingRight: "2.5rem"
        }}
      >
        {children}
      </select>
    </div>
  );
};

// Checkbox Group Field Component
export const CheckboxGroupField = ({ 
  label, 
  options, 
  selectedOptions, 
  onChange, 
  name,
  className = ''
}) => {
  const handleChange = (optionValue) => {
    const updatedSelection = selectedOptions.includes(optionValue)
      ? selectedOptions.filter(value => value !== optionValue)
      : [...selectedOptions, optionValue];
    
    onChange(updatedSelection);
  };
  
  return (
    <div className={`mb-5 ${className}`}>
      <label className="block text-[#2C2B4B] text-sm font-medium mb-2" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {label}
      </label>
      <div className="space-y-3">
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              type="checkbox"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={selectedOptions.includes(option.value)}
              onChange={() => handleChange(option.value)}
              className="h-5 w-5 text-[#59569D] focus:ring-[#59569D] border-[#E0E0E5] rounded-md transition-all duration-300"
            />
            <label 
              htmlFor={`${name}-${option.value}`} 
              className="ml-3 block text-[#2C2B4B]"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

// Card Component
export const Card = ({ 
  children, 
  className = '',
  variant = 'default',
  onClick = null
}) => {
  // Card variants based on the design system
  const cardVariants = {
    default: "bg-white rounded-3xl shadow-md p-6",
    promo: "bg-[#2C2B4B] text-white rounded-3xl shadow-md p-6",
    stats: "bg-white rounded-2xl shadow-md p-4",
    statsPurple: "bg-[#D7D6F4] rounded-2xl shadow-md p-4",
    statsOrange: "bg-[#FEE7D4] rounded-2xl shadow-md p-4",
    statsBlue: "bg-[#D6E6FE] rounded-2xl shadow-md p-4",
    contentList: "bg-[#FEE7D4] rounded-3xl shadow-md p-4",
    chart: "bg-white rounded-3xl shadow-md p-5",
    glass: "backdrop-filter backdrop-blur-xl bg-opacity-50 bg-[#2C2B4B] text-white rounded-3xl shadow-md p-6"
  };

  return (
    <div 
      className={`transition-all duration-300 ${cardVariants[variant]} ${onClick ? 'cursor-pointer hover:shadow-lg transform hover:-translate-y-1' : ''} ${className}`}
      onClick={onClick}
      style={{
        boxShadow: theme.effects.shadows.soft
      }}
    >
      {children}
    </div>
  );
};

// XP Progress Bar Component
export const XPProgressBar = ({ 
  currentXP, 
  nextLevelXP = 30,
  className = ''
}) => {
  const progress = Math.min(100, (currentXP / nextLevelXP) * 100);
  
  // Generate star icons based on progress
  const renderStars = () => {
    const totalStars = 5;
    const filledStars = Math.floor((progress / 100) * totalStars);
    
    return Array(totalStars).fill(0).map((_, index) => (
      <span key={index} className={`text-2xl ${index < filledStars ? 'text-[#F9A826]' : 'text-[#E0E0E5]'}`}>
        ★
      </span>
    ));
  };
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex space-x-2">
          {renderStars()}
        </div>
        <div className="text-sm font-semibold" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
          <span className="text-[#FF6B8A]">{currentXP}</span>
          <span className="text-[#8C8CA1]"> / </span>
          <span className="text-[#59569D]">{nextLevelXP}</span>
          <span className="text-[#F9A826] ml-1">★</span>
        </div>
      </div>
      <div className="w-full bg-[#F0F0F5] rounded-full h-5 shadow-inner overflow-hidden border border-[#E0E0E5]" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>

        <div 
          className="bg-gradient-to-r from-[#FF6B8A] to-[#59569D] h-5 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-3"
          style={{ width: `${progress}%` }}
        >
          <span className="text-xs text-white font-bold" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

// Modal Component
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'max-w-lg',
  variant = 'default'
}) => {
  if (!isOpen) return null;
  
  // Modal variants based on the design system
  const modalVariants = {
    default: "bg-white",
    purple: "bg-[#F5F5FF]",
    glass: "bg-opacity-80 backdrop-filter backdrop-blur-xl bg-[#2C2B4B] text-white"
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-filter backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className={`relative ${size} w-full mx-auto my-6 z-10 transition-all transform duration-300 ease-out`}>
        <div className={`border-0 rounded-3xl shadow-lg relative flex flex-col w-full outline-none focus:outline-none ${modalVariants[variant]}`}
          style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 ${variant === 'glass' ? '' : 'border-b border-[#E0E0E5]'} rounded-t-3xl`}>
            <h3 className={`text-xl font-semibold ${variant === 'glass' ? 'text-white' : 'text-[#2C2B4B]'}`} 
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              {title}
            </h3>
            <button
              className={`p-2 ml-auto rounded-full hover:bg-opacity-10 ${variant === 'glass' ? 'hover:bg-white text-white' : 'hover:bg-[#59569D] text-[#59569D]'} transition-colors duration-200 flex items-center justify-center`}
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          {/* Body */}
          <div className="relative p-6 flex-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading Spinner Component
export const LoadingSpinner = ({ 
  message = "Loading...",
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center h-full py-8 ${className}`}>
      <div className="animate-spin rounded-full h-14 w-14 border-t-3 border-b-3 border-[#59569D]"></div>
      <p className="mt-4 text-[#2C2B4B]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{message}</p>
    </div>
  );
};

// Icon Picker Modal Component
export const IconPickerModal = ({ 
  isOpen, 
  onClose, 
  onSelect 
}) => {
  // Get all icon names from lucide-react
  const iconNames = Object.keys(Icons).filter(name => 
    // Filter out non-icon exports
    typeof Icons[name] === 'function' && 
    name !== 'createLucideIcon' && 
    !name.startsWith('create') &&
    name !== 'default'
  ).sort();
  
  // Common icons to show first
  const commonIcons = [
    'Star', 'Heart', 'Award', 'Gift', 'Smile', 'Home', 'Book', 'BookOpen', 
    'CheckCircle', 'CheckSquare', 'Calendar', 'Clock', 'Music', 'Play', 
    'Utensils', 'Trash2', 'Pencil', 'Edit', 'User', 'Users', 'Baby',
    'Activity', 'Bicycle', 'Car', 'Gamepad2', 'Palette', 'Brush', 'Sparkles',
    'Sun', 'Moon', 'Cloud', 'Umbrella', 'Dog', 'Cat', 'Bird', 'Fish'
  ];
  
  // Reorder so common icons appear first
  const orderedIcons = [
    ...commonIcons.filter(name => iconNames.includes(name)),
    ...iconNames.filter(name => !commonIcons.includes(name))
  ];
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Select an Icon" 
      size="max-w-4xl"
      variant="purple"
    >
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search icons..."
          className="w-full px-4 py-3 bg-white border border-[#E0E0E5] rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#59569D] focus:border-[#59569D] transition-all duration-300"
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "0.9rem"
          }}
          onChange={(e) => {
            const searchInput = document.getElementById('icon-search-input');
            const searchTerm = e.target.value.toLowerCase();
            
            // Show all icons if search is empty
            if (!searchTerm) {
              document.querySelectorAll('.icon-item').forEach(el => {
                el.style.display = 'flex';
              });
              return;
            }
            
            // Filter icons based on search term
            document.querySelectorAll('.icon-item').forEach(el => {
              const iconName = el.getAttribute('data-icon-name').toLowerCase();
              if (iconName.includes(searchTerm)) {
                el.style.display = 'flex';
              } else {
                el.style.display = 'none';
              }
            });
          }}
          id="icon-search-input"
        />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[450px] overflow-y-auto p-2 pr-4">
        {orderedIcons.map(name => {
          const IconComponent = Icons[name];
          return (
            <div 
              key={name} 
              className="icon-item flex flex-col items-center justify-center p-3 bg-white border border-[#E0E0E5] rounded-2xl cursor-pointer hover:shadow-md hover:border-[#59569D] transition-all duration-300 transform hover:-translate-y-1"
              data-name={name.toLowerCase()}
              onClick={() => onSelect(name)}
              style={{ boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
            >
              <IconComponent className="h-8 w-8 text-[#59569D]" />
              <span className="mt-2 text-xs text-[#2C2B4B] truncate w-full text-center" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{name}</span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

// Parent Passcode Modal Component
export const ParentPasscodeModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  error 
}) => {
  const [passcode, setPasscode] = React.useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(passcode);
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Enter Parent Passcode" 
      size="max-w-md"
      variant="purple"
    >
      <form onSubmit={handleSubmit}>
        <InputField
          label="Passcode"
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Enter your 4-digit passcode"
          required
        />
        
        {error && (
          <div className="text-red-500 text-sm mb-4 rounded-lg p-2 bg-red-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{error}</div>
        )}
        
        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Submit
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Function to render Lucide icons by name
export const renderLucideIcon = (name, props = {}) => {
  const IconComponent = Icons[name];
  return IconComponent ? <IconComponent {...props} /> : <Icons.Package {...props} />;
};

// Export all available icon names for use in the app
export const availableIcons = Object.keys(Icons).filter(name => 
  typeof Icons[name] === 'function' && 
  name !== 'createLucideIcon' && 
  name !== 'default' &&
  !name.startsWith('create')
).sort();

// Re-export AccessibilityOptions
export { AccessibilityOptions };
