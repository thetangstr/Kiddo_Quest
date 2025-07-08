import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

const TutorialHighlight = ({ 
  selector, 
  message, 
  position = 'bottom',
  onComplete,
  pulseEffect = true,
  autoProgress = false,
  autoProgressDelay = 3000
}) => {
  const [targetElement, setTargetElement] = useState(null);
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [messagePosition, setMessagePosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Find the target element
    const findElement = () => {
      if (!selector) return null;
      
      // Try different selector types
      let element;
      if (typeof selector === 'string') {
        element = document.querySelector(selector);
      } else if (selector instanceof HTMLElement) {
        element = selector;
      }
      
      return element;
    };

    // Calculate positions
    const calculatePositions = () => {
      const element = findElement();
      if (!element) {
        console.warn(`Tutorial highlight: Element not found for selector "${selector}"`);
        return;
      }

      setTargetElement(element);
      
      // Get element position and size
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      // Set highlight position (slightly larger than the element)
      const padding = 5;
      setHighlightPosition({
        top: rect.top + scrollTop - padding,
        left: rect.left + scrollLeft - padding,
        width: rect.width + (padding * 2),
        height: rect.height + (padding * 2)
      });

      // Calculate message position based on specified position
      let msgTop, msgLeft;
      const msgWidth = 250; // Approximate width of message box
      
      switch (position) {
        case 'top':
          msgTop = rect.top + scrollTop - 80;
          msgLeft = rect.left + scrollLeft + (rect.width / 2) - (msgWidth / 2);
          break;
        case 'bottom':
          msgTop = rect.bottom + scrollTop + 10;
          msgLeft = rect.left + scrollLeft + (rect.width / 2) - (msgWidth / 2);
          break;
        case 'left':
          msgTop = rect.top + scrollTop + (rect.height / 2) - 40;
          msgLeft = rect.left + scrollLeft - msgWidth - 10;
          break;
        case 'right':
          msgTop = rect.top + scrollTop + (rect.height / 2) - 40;
          msgLeft = rect.right + scrollLeft + 10;
          break;
        default:
          msgTop = rect.bottom + scrollTop + 10;
          msgLeft = rect.left + scrollLeft + (rect.width / 2) - (msgWidth / 2);
      }

      // Ensure message stays within viewport
      if (msgLeft < 10) msgLeft = 10;
      if (msgLeft + msgWidth > window.innerWidth - 10) {
        msgLeft = window.innerWidth - msgWidth - 10;
      }

      setMessagePosition({ top: msgTop, left: msgLeft });
      setVisible(true);
    };

    // Initial calculation
    calculatePositions();

    // Recalculate on window resize
    window.addEventListener('resize', calculatePositions);

    // Auto progress if enabled
    let timer;
    if (autoProgress && onComplete) {
      timer = setTimeout(() => {
        onComplete();
      }, autoProgressDelay);
    }

    // Add click event to target element
    const handleTargetClick = () => {
      if (onComplete) {
        onComplete();
      }
    };

    if (targetElement) {
      targetElement.addEventListener('click', handleTargetClick);
    }

    return () => {
      window.removeEventListener('resize', calculatePositions);
      if (timer) clearTimeout(timer);
      if (targetElement) {
        targetElement.removeEventListener('click', handleTargetClick);
      }
    };
  }, [selector, position, onComplete, autoProgress, autoProgressDelay]);

  // Create portal for the highlight
  return ReactDOM.createPortal(
    visible && (
      <>
        {/* Overlay that dims the rest of the screen */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9998,
            pointerEvents: 'none'
          }}
        />
        
        {/* Cutout for the highlighted element */}
        <div 
          style={{
            position: 'absolute',
            top: highlightPosition.top,
            left: highlightPosition.left,
            width: highlightPosition.width,
            height: highlightPosition.height,
            border: '2px solid #4285F4',
            borderRadius: '4px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            pointerEvents: 'none',
            animation: pulseEffect ? 'pulse 1.5s infinite' : 'none'
          }}
        />
        
        {/* Pulse animation */}
        <style>
          {`
            @keyframes pulse {
              0% {
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(66, 133, 244, 0.7);
              }
              70% {
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 10px rgba(66, 133, 244, 0);
              }
              100% {
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(66, 133, 244, 0);
              }
            }
          `}
        </style>
        
        {/* Message tooltip */}
        <div
          style={{
            position: 'absolute',
            top: messagePosition.top,
            left: messagePosition.left,
            backgroundColor: 'white',
            padding: '10px 15px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            zIndex: 10000,
            maxWidth: '250px',
            pointerEvents: 'none',
            fontSize: '14px',
            lineHeight: '1.4',
            color: '#333',
            transform: 'translateZ(0)',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div 
            style={{
              position: 'absolute',
              width: '12px',
              height: '12px',
              backgroundColor: 'white',
              transform: position === 'bottom' ? 'rotate(45deg) translate(-50%, -50%)' : 
                        position === 'top' ? 'rotate(45deg) translate(-50%, 50%)' :
                        position === 'left' ? 'rotate(45deg) translate(50%, -50%)' :
                        'rotate(45deg) translate(-50%, -50%)',
              top: position === 'bottom' ? '0' : 
                   position === 'top' ? '100%' : 
                   '50%',
              left: position === 'right' ? '0' : 
                    position === 'left' ? '100%' : 
                    '50%',
              zIndex: 9999,
              pointerEvents: 'none'
            }}
          />
          {message}
        </div>
        
        {/* Fade in animation */}
        <style>
          {`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        </style>
      </>
    ),
    document.body
  );
};

export default TutorialHighlight;
