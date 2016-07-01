# Pulsor

Hierarchical Object Publisher.

**Pulsor** is simple and minimal [publish/subscribe pattern architecture](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) with hierarchical publishing.

Pulsor's object publication is uni-directional and very efficient. because it distribute changed properties only, not a entire snapshot.

It is for **efficient Realtime-Pushing** via WebSocket and HTML UI rendering especially with [React](https://facebook.github.io/react/) or TCP/IP native socket.

And used for generic/simplified in-process Message-Router/Bus or Broker.


## Table of Contents

1. Overview
1. Tutorials
  1.  Simple Message Router
  1.  Hierarchical Message Router
1. Publishers
  1.  Topic
  1.  Hierarchical Topic
  1.  Object
  1.  Object's Properties
1. Subscribers and Consumers
  1.  WebSocket
  1.  TCP/IP socket
  1.  UI Element  (especially React Component)

