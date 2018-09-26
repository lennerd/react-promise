import { Component } from 'react';

export interface IRenderState<Value> {
  value: Value | null;
  error: any;
  isLoading: boolean;
}

interface IProps<Value> {
  delay?: number;
  value: Value | Promise<Value>;
  children?: (state: IRenderState<Value>) => any;
}

interface IState<Value> extends IRenderState<Value> {
  promise: Promise<Value> | null;
}

function isPromise(value: any): value is Promise<any> {
  return value && typeof value.then !== 'undefined';
}

class PromiseResolver<Value = any> extends Component<IProps<Value>, IState<Value>> {
  public static defaultProps = {
    delay: 200,
  };

  public static getDerivedStateFromProps<Value = any>(props: IProps<Value>, state: IState<Value>) {
    const { value, delay } = props;

    if (!isPromise(value)) {
      return { error: null, isLoading: false, promise: null, value };
    }

    if (value === state.promise) {
      return null;
    }

    const promise = value;
    let isLoading = false;

    if (delay == null || delay <= 0) {
      isLoading = true;
    }

    return { ...state, isLoading, promise };
  }

  public readonly state: IState<Value> = {
    error: null,
    isLoading: false,
    promise: null,
    value: null,
  };

  private delayTimeout: ReturnType<typeof setTimeout> | null = null;
  private mounted = false;

  public componentDidMount() {
    this.mounted = true;
    this.handlePromise();
  }

  public componentWillUnmount() {
    this.mounted = false;
    this.clearDelayTimeout();
  }

  public componentDidUpdate(prevProps: IProps<Value>, prevState: IState<Value>) {
    // Only start new promise life-cycle when promise was actually changed.
    if (prevState.promise !== this.state.promise) {
      this.clearDelayTimeout();
      this.handlePromise();
    }
  }

  public render() {
    const { children } = this.props;
    const { value, error, isLoading } = this.state;

    if (children == null) {
      return value;
    }

    return children({ value, error, isLoading });
  }

  private handlePromise() {
    const { promise } = this.state;

    if (promise == null) {
      return;
    }

    promise.then(
      value => {
        this.handleResolved(promise, value);
      },
      error => {
        this.handleRejected(promise, error);
      }
    );

    const { delay } = this.props;

    if (delay != null && delay > 0) {
      this.delayTimeout = setTimeout(() => {
        this.handleDelayTimeout();
      }, delay);
    }
  }

  private clearDelayTimeout() {
    if (this.delayTimeout != null) {
      clearTimeout(this.delayTimeout);
      this.delayTimeout = null;
    }
  }

  private handleResolved(prevPromise: Promise<any>, value: any) {
    // Check if a new promise was registered and component still mounted.
    if (prevPromise !== this.state.promise) {
      return;
    }

    this.clearDelayTimeout();

    this.setState({
      error: null,
      isLoading: false,
      value,
    });
  }

  private handleRejected(prevPromise: Promise<any>, error: any) {
    // Check if a new promise was registered and component still mounted.
    if (prevPromise !== this.state.promise || !this.mounted) {
      return;
    }

    this.clearDelayTimeout();

    this.setState({
      error,
      isLoading: false,
      value: null,
    });
  }

  private handleDelayTimeout() {
    this.setState({
      isLoading: true,
    });
  }
}

export default PromiseResolver;
