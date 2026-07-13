"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
}

export default class TabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="chalkboard rounded-lg p-8 text-center my-4 mx-auto max-w-md">
          <p className="text-3xl mb-2" aria-hidden>
            🏈
          </p>
          <h3 className="font-[family-name:var(--font-display)] text-xl text-[#F5F0E8] text-shadow-glow-chalk">
            Fumble!
          </h3>
          <p className="mt-2 text-sm text-[#F5F0E8]/70">
            {this.props.fallbackLabel ||
              "This section hit a snag. Try refreshing."}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
