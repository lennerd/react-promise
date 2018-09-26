# PromiseResolver

Simple promise resolver for React.

``` js
<PromiseResolver value={Promise.resolve('Resolved …')}>
  {({ value, isLoading, error }) => {
    return error || (isLoading && 'Is loading …') || value;
  }}
</PromiseResolver>
```
