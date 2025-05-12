import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './UI';

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child component tree,
 * log those errors, and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // In production, you could send this to a logging service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-6 text-center">
              We're sorry, but an error occurred while trying to display this page.
            </p>
            <div className="space-y-4">
              <Button 
                onClick={this.handleReset} 
                className="w-full flex items-center justify-center"
              >
                <RefreshCw size={16} className="mr-2" /> Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full"
              >
                Reload Page
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gray-100 rounded-md overflow-auto max-h-60">
                <p className="font-mono text-xs text-red-600 whitespace-pre-wrap">
                  {this.state.error && this.state.error.toString()}
                </p>
                <p className="font-mono text-xs text-gray-700 whitespace-pre-wrap mt-2">
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
