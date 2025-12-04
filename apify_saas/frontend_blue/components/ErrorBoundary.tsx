import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-10">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 max-w-4xl w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong (Frontend Crash)</h1>
            
            <div className="bg-gray-100 p-4 rounded-md overflow-auto mb-6 border border-gray-300">
                <h3 className="font-bold text-gray-700">Error Message:</h3>
                <p className="text-red-600 font-mono text-sm mb-4">
                    {this.state.error && this.state.error.toString()}
                </p>
                
                <h3 className="font-bold text-gray-700">Component Stack:</h3>
                <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
            </div>

            <button 
                onClick={() => window.location.reload()}
                className="bg-brand-600 text-white px-6 py-2 rounded hover:bg-brand-700"
            >
                Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
