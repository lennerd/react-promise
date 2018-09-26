import * as React from 'react';
import { shallow } from 'enzyme';

import PromiseResolver from '../PromiseResolver';

function shallowRenderPromiseResolver<Value>(value: Value) {
  return shallow(
    <PromiseResolver<Value> value={value}>
      {({ value, isLoading, error }) => {
        return error || (isLoading && 'Is loading …') || value;
      }}
    </PromiseResolver>
  );
}

describe('PromiseResolver', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('renders resolved value without children', async () => {
    const promise = Promise.resolve('foo');
    const component = shallow(<PromiseResolver value={promise} />);

    expect(component).toBeEmptyRender();

    const value = await promise;
    expect(component).toHaveText(value);
  });

  it('renders value immeditately if not a promise', () => {
    const component = shallow(<PromiseResolver value="bar" />);
    expect(component).toHaveText('bar');
  });

  it('uses children as render prop', async () => {
    const promise = Promise.resolve('bar');
    const component = shallowRenderPromiseResolver(promise);

    // Delay was not exceeded yet
    expect(component).toBeEmptyRender();

    // Check for actual promise to be resolved
    const value = await promise;
    expect(component).toHaveText(value);
  });

  it('delays isLoading', () => {
    const promise = Promise.resolve('baz 1');
    const component = shallowRenderPromiseResolver(promise);

    jest.advanceTimersByTime(PromiseResolver.defaultProps.delay);

    // Delay was not exceeded yet
    expect(component).toHaveText('Is loading …');

    component.setProps({ delay: 1000, value: Promise.resolve('baz 2') });
    expect(component).toBeEmptyRender();

    jest.advanceTimersByTime(PromiseResolver.defaultProps.delay);
    expect(component).toBeEmptyRender();

    jest.advanceTimersByTime(1000 - PromiseResolver.defaultProps.delay);
    expect(component).toHaveText('Is loading …');

    component.setProps({ delay: 0, value: Promise.resolve('baz 3') });
    expect(component).toHaveText('Is loading …');
  });

  it('handles rejections', async () => {
    const promise1 = Promise.reject('rejected 1');
    const component = shallowRenderPromiseResolver(promise1);

    const error = 'rejected 2';
    const promise2 = Promise.reject(error);
    // Unset previous promise to check if current passed promise is checked correctly.
    component.setProps({ value: promise2 });

    try {
      await promise1;
    } catch (_) {
      expect(component).toHaveText(error);
    }
  });
});
