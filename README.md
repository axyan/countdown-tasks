# Countdown Tasks
Countdown Tasks was created to help manage a list of countdown timers. Useful 
for managing serveral concurrent tasks/timer that can be monitored via the web.

Project was created using MongoDB, Express, React, and Node (MERN stack). MongoDB 
was used due to experience using it in previous projects. A relational database is 
preferred due to relationships between user and task items. Express, Node, and 
React used due to familiarity and ease of development. Bootstrap was also used 
to create a simple UI for users.

One challenge that was encountered during development was not being able to set 
cookies across domains as the client and server are hosted on separate domains.
This problem was also related to both domains beloning to the Public Suffix List 
which meant it was not possible to set cookies for these domains. Thus the client 
was responsible for setting a cookie containing the JWT string received from the 
backend. To emulate a HttpOnly cookie, the JWT string is encrypted so that the 
client could save the encrypted string in a cookie. The string would need to be 
decrypted and attached as a Bearer token to the client request to be considered 
a valid request for the server. If client and server were on the same domain, 
I would prefer using HttpOnly, SameSite, and Secure cookies to securely store JWT.

## Install

```console
$ git clone https://github.com/axyan/countdown-tasks.git
$ cd countdown-tasks
$ npm install
```

## Usage

```console
$ docker compose up -d
$ npm run dev
```

## Testing

```console
$ npm run test
```
