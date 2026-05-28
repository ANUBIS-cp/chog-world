"use client";
import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <AlertTriangle size={48} className="text-[#EF4444] mb-4" />
          <h2 className="text-lg font-semibold text-[#F0F0F5] mb-2">Something went wrong</h2>
          <p className="text-sm text-[#6B7280] text-center max-w-md mb-4">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-[#7C5CFF] hover:bg-[#9A7FFF] rounded-xl text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
