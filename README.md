
# Bazar.com - Online Bookstore

**Project for Distributed Operating Systems Course**  
**By:** Aya Awwad & Shahad Jawabreh

## Overview
Bazar.com is a scalable, multi-tier online bookstore application designed using microservices architecture with Docker.  
It features a **Catalog Service**, an **Order Service**, and a **Frontend Interface**, each developed and deployed independently.

## Technologies Used
- **Backend:** Node.js, Express.js
- **Frontend:** HTML, CSS, JavaScript
- **Libraries:** 
  - express
  - csv-parser
  - body-parser
  - axios
  - cors
- **Containerization:** Docker, Docker Compose
- **Communication:** REST API

## System Architecture

### Frontend Service
- Provides a user interface for searching books, viewing book details, and purchasing/unpurchasing books.
- Runs on port **80**.

### Catalog Service
- Handles search and information retrieval for books.
- Runs on port **3000** (with replica at **3002**).

### Order Service
- Handles book purchases and stock updates.
- Runs on port **3001** (with replica at **3003**).

### Networking
- All services communicate internally over a Docker bridge network `book_store_network`.

## Key Features

### In-Memory Cache
- Speeds up repeated search and information retrieval by caching results in memory.

### Load Balancing
- Uses a **Round Robin** algorithm to distribute requests across server replicas for better performance and availability.

### Server Replicas
- Each main service (Catalog and Order) has a replica to ensure high availability.

### Replica Synchronization
- When a book is purchased or unpurchased, all replicas are updated to maintain data consistency.

## How to Run
1. Ensure Docker and Docker Compose are installed.
2. Navigate to the project directory.
3. Run the following command:
   ```bash
   docker-compose up --build
   ```

### Access the Application
- Open your web browser (like Chrome).
- Go to:
  ```
  http://localhost
  ```
- You can:
  - Search for books.
  - View book details.
  - Purchase books.
  - Unpurchase books.

## Conclusion
This project demonstrates how to build a modular, scalable, and efficient microservices-based system using Docker and Node.js.  
It highlights important aspects such as caching, load balancing, replication, and synchronization to improve performance and reliability.
