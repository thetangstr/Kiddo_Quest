import React from 'react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { Trophy, Star, Award, Medal, Crown, Shield, Gift, Sparkles, Lock } from 'lucide-react';

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
  const baseClasses = "flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    outline: "border border-gray-300 hover:bg-gray-100 text-gray-700 focus:ring-gray-500",
    link: "text-indigo-600 hover:text-indigo-800 underline p-0 focus:ring-indigo-500"
  };
  
  const sizeClasses = variant === 'link' ? "" : "px-4 py-2";
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
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
  required = false 
}) => {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-medium mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
  rows = 3 
}) => {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-medium mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        required={required}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
  children 
}) => {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-medium mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        name={name}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
  name 
}) => {
  const handleChange = (optionValue) => {
    const updatedSelection = selectedOptions.includes(optionValue)
      ? selectedOptions.filter(value => value !== optionValue)
      : [...selectedOptions, optionValue];
    
    onChange(updatedSelection);
  };
  
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-medium mb-2">
        {label}
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              type="checkbox"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={selectedOptions.includes(option.value)}
              onChange={() => handleChange(option.value)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor={`${name}-${option.value}`} className="ml-2 block text-gray-700">
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
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

// Enhanced XP Progress Bar Component with animations and gamification elements
export const XPProgressBar = ({ 
  progress = 0, 
  level = 1, 
  showLevel = true 
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  
  // Define milestone points on the progress bar
  const milestones = [20, 40, 60, 80, 100];
  
  // Calculate how many milestones have been reached
  const reachedMilestones = milestones.filter(milestone => normalizedProgress >= milestone).length;
  
  // Animation variants for framer-motion
  const progressVariants = {
    initial: { width: 0, opacity: 0.5 },
    animate: { 
      width: `${normalizedProgress}%`, 
      opacity: 1,
      transition: { 
        duration: 1.5, 
        ease: "easeOut" 
      }
    }
  };
  
  const starVariants = {
    unfilled: { scale: 1, opacity: 0.5, color: "#D1D5DB" },
    filled: { 
      scale: [1, 1.3, 1], 
      opacity: 1, 
      color: "#FBBF24",
      transition: { 
        duration: 0.5,
        repeat: 1,
        repeatType: "reverse" 
      }
    }
  };
  
  const renderStars = () => {
    const totalStars = 5;
    const filledStars = Math.floor((normalizedProgress / 100) * totalStars);
    
    return Array(totalStars).fill(0).map((_, index) => {
      const isFilled = index < filledStars;
      const isLastFilled = index === filledStars - 1;
      const milestone = milestones[index];
      const isReached = normalizedProgress >= milestone;
      
      return (
        <div key={index} className="relative flex flex-col items-center">
          <motion.span 
            className={`text-2xl ${isFilled ? 'text-yellow-400' : 'text-gray-300'}`}
            variants={starVariants}
            initial="unfilled"
            animate={isFilled ? "filled" : "unfilled"}
            whileHover={{ scale: 1.2 }}
          >
            ★
          </motion.span>
          
          {/* Milestone label */}
          <motion.div 
            className={`text-xs font-bold mt-1 ${isReached ? 'text-purple-600' : 'text-gray-400'}`}
            animate={isReached ? { y: [0, -3, 0], scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: isLastFilled ? Infinity : 0, repeatType: "reverse" }}
          >
            {milestone}%
          </motion.div>
        </div>
      );
    });
  };

  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {showLevel && (
        <motion.div 
          className="flex justify-between mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex items-center">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md mr-2 flex items-center"
              whileHover={{ scale: 1.05 }}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            >
              <Trophy size={14} className="mr-1" />
              <span>Level {level}</span>
            </motion.div>
            
            {level > 1 && (
              <motion.div 
                className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full border border-yellow-200"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span>+{level - 1} Levels Earned!</span>
              </motion.div>
            )}
          </div>
          
          <motion.div 
            className="bg-purple-100 text-purple-700 text-sm font-bold px-3 py-1 rounded-full shadow-inner border border-purple-200"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {normalizedProgress}% Complete
          </motion.div>
        </motion.div>
      )}
      
      {/* Progress bar container */}
      <div className="w-full bg-gray-200 rounded-full h-6 mb-3 overflow-hidden shadow-inner relative">
        {/* Milestone markers */}
        {milestones.slice(0, -1).map((milestone, index) => (
          <motion.div 
            key={index}
            className="absolute top-0 bottom-0 w-0.5 bg-white z-10 opacity-70"
            style={{ left: `${milestone}%` }}
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{ delay: 0.5 + (index * 0.1), duration: 0.3 }}
          />
        ))}
        
        {/* Animated progress fill */}
        <motion.div 
          className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-6 rounded-full relative overflow-hidden"
          variants={progressVariants}
          initial="initial"
          animate="animate"
        >
          {/* Animated shine effect */}
          <motion.div 
            className="absolute top-0 bottom-0 w-20 bg-white opacity-20 transform -skew-x-30"
            animate={{ x: [-100, 400] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
          
          {/* Progress bubbles animation */}
          {normalizedProgress > 10 && Array(3).fill(0).map((_, i) => (
            <motion.div 
              key={i}
              className="absolute top-1 w-2 h-2 rounded-full bg-white opacity-70"
              style={{ left: `${20 + (i * 30)}%` }}
              animate={{ 
                y: [0, -10, 0],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 2, 
                delay: i * 0.3, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          ))}
        </motion.div>
      </div>
      
      {/* Star milestones */}
      <div className="flex justify-between px-2">
        {renderStars()}
      </div>
      
      {/* Achievement badges */}
      {reachedMilestones > 0 && (
        <motion.div 
          className="mt-3 flex justify-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          {Array(reachedMilestones).fill(0).map((_, index) => (
            <motion.div 
              key={index}
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-1 rounded-full shadow-md"
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, 0] }}
              transition={{ delay: 1 + (index * 0.2), duration: 0.5 }}
              whileHover={{ scale: 1.2 }}
            >
              <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center text-yellow-500">
                {index === 0 && <Star size={16} />}
                {index === 1 && <Award size={16} />}
                {index === 2 && <Medal size={16} />}
                {index === 3 && <Trophy size={16} />}
                {index === 4 && <Crown size={16} />}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

// Modal Component
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'max-w-lg' 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${size} sm:w-full`}>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{title}</h3>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading Spinner Component
export const LoadingSpinner = ({ 
  message = "Loading..." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      <p className="mt-4 text-gray-600">{message}</p>
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
    >
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search icons..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
      
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 max-h-96 overflow-y-auto p-2">
        {orderedIcons.map(iconName => {
          const IconComponent = Icons[iconName];
          return (
            <div 
              key={iconName}
              data-icon-name={iconName}
              onClick={() => onSelect(iconName)}
              className="icon-item flex flex-col items-center justify-center p-3 border rounded-md cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
            >
              <IconComponent className="w-8 h-8 mb-2 text-indigo-600" />
              <span className="text-xs text-center truncate w-full font-medium">{iconName}</span>
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
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}
        
        <div className="flex justify-end space-x-3">
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
  !name.startsWith('create')
).sort();
