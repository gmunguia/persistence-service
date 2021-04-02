# Persistence service

A key-value persistence service with an HTTP API.

## Why?

Educational purposes.

## API

An application identifier is used to avoid collisions with other people using the service.

### Create a pair

#### Example

How to insert a pair with key `8e396b2f-2a39-447c-8317-3bae6a4a22ff` and value `{ id: [...] }` into the application `2710638a-a986-442f-b029-feb40bd4d4dd`:

```
PUT /pairs/8e396b2f-2a39-447c-8317-3bae6a4a22ff HTTP/1.1
[...]
x-application-id: 2710638a-a986-442f-b029-feb40bd4d4dd

{
  id: [...],
  title: [...],
  [...]
}
```

### Read a pair

#### Example

How to read the value that corresponds to the key `8e396b2f-2a39-447c-8317-3bae6a4a22ff` in the application `2710638a-a986-442f-b029-feb40bd4d4dd`:

```
GET /pairs/8e396b2f-2a39-447c-8317-3bae6a4a22ff HTTP/1.1
[...]
x-application-id: 2710638a-a986-442f-b029-feb40bd4d4dd
```

### Read all pairs

#### Example

How to read all pairs in the application `2710638a-a986-442f-b029-feb40bd4d4dd`:

```
GET /pairs HTTP/1.1
[...]
x-application-id: 2710638a-a986-442f-b029-feb40bd4d4dd
```

### Read pairs by key prefix

#### Example

How to read all pairs whose key begins with `prefix-` in the application `2710638a-a986-442f-b029-feb40bd4d4dd`:

```
GET /collections/prefix- HTTP/1.1
[...]
x-application-id: 2710638a-a986-442f-b029-feb40bd4d4dd
```
