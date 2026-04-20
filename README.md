# 🌱 SmartSeason Field Monitoring System

A full-stack agricultural operations platform designed to help coordinators and field agents track crop lifecycle stages, manage field data, and monitor operational risks in real time.

---

## 🚀 Overview

SmartSeason is a field monitoring system built to simulate real-world agricultural operations. It enables structured tracking of fields from planting to harvest, with role-based access for administrators and field agents.

The system focuses on **clean data management, operational visibility, and simple decision support for agricultural workflows.**

---

## 🔐 Authentication & Access Control

The system includes a working authentication flow:

- User registration (Sign Up)
- Secure login system
- Session-based access control

### Roles

#### 👨‍💼 Admin (Coordinator)
- Manages all fields in the system
- Monitors crop progress across all agents
- Reviews field updates and risks

#### 🌾 Field Agent
- Accesses only assigned fields
- Updates crop stages
- Adds field observations and notes

---

## 🌱 Core Features

- Field creation and management  
- Assignment of fields to agents  
- Crop lifecycle tracking system  
- Field stage updates (Planted → Growing → Ready → Harvested)  
- Real-time field updates via database  
- Role-based dashboards  
- Basic risk and status monitoring  

---

## 🧠 Field Lifecycle Model

Fields progress through a structured lifecycle:

- **Planted** → Initial crop planting stage  
- **Growing** → Active growth phase  
- **Ready** → Near harvest stage  
- **Harvested** → Completed cycle  

---

## ⚙️ Status Logic

Each field is assigned a computed status based on its lifecycle stage and activity:

- **Active** → Field is currently progressing through lifecycle stages  
- **At Risk** → Field shows delayed updates or abnormal progression  
- **Completed** → Field has reached harvest stage  

This logic simulates real-world agricultural monitoring systems.

---

## 🗄️ Data & Architecture

- Database-backed system for persistent field storage  
- Structured field entities with lifecycle attributes  
- Separation between user roles and field data  
- Modular design for scalability  

---

## 📊 Dashboard Overview

### Admin Dashboard
- View all fields across the system  
- Monitor crop stages and status distribution  
- Track field activity across agents  

### Field Agent Dashboard
- View assigned fields only  
- Update crop stages  
- Add notes and observations  

---

## 🛠️ Tech Stack

- Frontend: HTML / CSS / JavaScript  
- Backend: Node.js (or your actual backend)  
- Database: SQL / NoSQL (your implementation)  
- Authentication: Session-based / JWT (if used)  
- Hosting: Replit deployment  

---

## 🌐 Live Demo

🔗 https://smart-season-tracker--kemboisam339.replit.app

---

## 🧩 Key Engineering Decisions

- Prioritized simplicity over over-engineering  
- Designed role-based separation for realistic operations  
- Implemented lifecycle-based field tracking model  
- Used modular structure for maintainability  

---

## 📌 Notes

This project is a functional prototype of an agricultural field monitoring system. Some advanced analytics and production-level optimizations can be extended in future iterations.

---

## 👨‍💻 Author

**Sammy Kemboi**  
Software Engineering Graduate  
GitHub: https://github.com/samm2169  
## 🔑 Demo Credentials

### Admin
Email: admin@smartseason.com  
Password: admin123  

### Field Agent
Email: agent@smartseason.com  
Password: agent123
