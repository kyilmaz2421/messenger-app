# Messeneger Application

A fully functional Messenger application (inspired by Slack and Facebook Messenger) using SocketIO, Redis, Node.js, and MongoDB

Currently hosted on Heroku at https://messaging-chat-app.herokuapp.com/

# How to run environment locally

1. Clone down this repository

2. Run `npm install`

3. Create a `config/dev.env`

4. In the `dev.env` file the following variable must be set `PORT`, `MONGODB_URL`,`JWT_SECRET`,`COOKIE_SECRET`,`REDIS_URL`

5. Run your Mongo and Redis servers

6. Run `npm run dev` for dev environment OR run `npm run start` for production environment

# Introduction

This is my passion project where I had the goal of building a full scale, non-trivial web application. My intention was to develop a messaging application because I have always been curious about how messaging applications like Facebook and Slack work, and I really wanted to learn how to would build a real time application with events. Building this passion project was very fun and I learned a ton, developing my skills with many tools such as Node.js and MongoDB and learning some new technologies such as Redis and SocketIO.

# Front end

One of my primary goals with this project was also developing my front end Javascript skills and working with the DOM. I wanted to challenge myself to build a full-scale. single-page real time website without using any frameworks like Angular.js or React.js. Although using such a framework would have certainly been the right decision for building a robust application my goal was to build these feutures from scratch myself so as to better learn about them.

For styling I used the Semantic UI framework instead of Bootstrap again with the goal of learning something new and furthering my front end development skills

# Backend

For the backend I chose Node.js because I really like working with the express framework and wanted to spend some more time learning Javascript. Compared to Javascript I have had more experience building applications with Python and Java, therefore I believed this was a good oppurtunity to build a full Javascript appplication.

For the Database I used MongoDB because I thought that its speed and versatility would come in handy for an application like this. Further, I really enjoy using Mongoose and find it to be a very effective framework.

# Events Engine

I used SocketIO to handle the events and allow all actions such as creating/deleting chatrooms, sending/recieving messages, changing the group name, and adding/removing members to a chatroom to be seen in real time and in under a second on average.

I used server side Redis caching as well to speed up the process of running certain events like sendng/recieving messages. Overall using Redis cut event latency by about 50%.

# Authentication and Security

I designed my website with security in mind ensuring my website met basic security standards. I have security features such as hashed passwords, utlilizing signed cookies as authentication tokens, and applying authentication before granting access to all API endpoints and events. I also developed some protection against XSS attacks and script injections

# Future Improvments

- Utilize a front end framework and rebuild the front end using it (Ideally React.js or Vue.js)
- Improve the front end aesthetic and design, making the website prettier and also more user friendly
- Dockerize the backend infrastructure and host it in AWS to enable more effective scaling and control over deployments
- If I were to redo this project I would have streamlined some of my backend systems to acheive slightly cleaner and more extensible code
