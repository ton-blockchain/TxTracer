import React, {Component} from "react"

interface ErrorBoundaryProps {
  readonly children: React.ReactNode
  readonly onError?: (error: unknown) => void
  readonly resetKey?: string | number | undefined | null
}

interface ErrorBoundaryState {
  readonly hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {hasError: false}
  }

  static getDerivedStateFromError() {
    return {hasError: true}
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("ErrorBoundary caught:", error, info)
    this.props.onError?.(error)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({hasError: false})
    }
  }

  render() {
    if (this.state.hasError) {
      return <div style={{padding: 32}}>Something went wrong 😢</div>
    }
    return this.props.children
  }
}
