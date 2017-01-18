# Pulsor

Hierarchical Object Publisher.


## Page under construction...


**Pulsor** is simple and minimal javascript [publish/subscribe pattern](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) implementation with hierarchical publishing.

Pulsor's Object Publication is **very efficient**. because it distributes **changed properties only**, not an entire snapshot.

It is for
- **Efficient Realtime-Pushing** via [WebSocket]()
- **HTML UI rendering** especially with [React](https://facebook.github.io/react/)
- Generic pub/sub with Network and/or Persistence Resources (TCP/IP, Datbases, Etc)
- Simplified in-process [Message-Router/Bus]().

also, it is used for [Strobe](#). (declarative client-side framework using [React](https://facebook.github.io/react/)) and [Pulsor](https://github.com/movablecode/pulsor)

## Examples

## in Node.js

## in Browser

## Table of Contents

1. [Overview](doc/overview.md)
1. [Tutorials](doc/tutorials.md)
  1.  [Simple Message Router](doc/tutorials.md#topic)
  1.  [Hierarchical Message Router](doc/tutorials.md#htopic)
  1.  [Object Publishing](doc/tutorials.md#object)
1. Publishers
  1.  Topic
  1.  Hierarchical Topic
  1.  Object
  1.  Object's Properties
1. Subscribers and Consumers
  1.  WebSocket
  1.  UI Element  (especially React Component)
  1.  TCP/IP socket

##  License

MIT

