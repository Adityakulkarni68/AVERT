# Attendance Management System - Architecture

```mermaid
graph TB
    subgraph Frontend
        UI[Web Interface]
        Auth[Auth Module]
        TD[Teacher Dashboard]
        AD[Admin Dashboard]
    end

    subgraph Backend
        API[API Gateway]
        AS[Auth Service]
        ATS[Attendance Service]
        RGS[Report Service]
    end

    subgraph Database
        UDB[(User DB)]
        ADB[(Attendance DB)]
        SDB[(Student DB)]
    end

    subgraph Security
        RBAC[RBAC]
        SM[Session Mgmt]
        DE[Encryption]
    end

    %% Connections
    UI --> API
    Auth --> API
    TD --> API
    AD --> API
    API --> AS
    API --> ATS
    API --> RGS
    AS --> UDB
    ATS --> ADB
    ATS --> SDB
    RGS --> ADB
    Security --> API
    Security --> AS

    %% Styling
    classDef frontend fill:#4a6bff,stroke:#333,color:white
    classDef backend fill:#28a745,stroke:#333,color:white
    classDef database fill:#ffc107,stroke:#333,color:black
    classDef security fill:#dc3545,stroke:#333,color:white

    class UI,Auth,TD,AD frontend
    class API,AS,ATS,RGS backend
    class UDB,ADB,SDB database
    class RBAC,SM,DE security
```

## Key Components

### Frontend
- Web Interface (HTML/CSS/JS)
- Authentication Module
- Teacher/Admin Dashboards

### Backend
- API Gateway
- Auth Service
- Attendance Service
- Report Service

### Database
- User DB
- Attendance DB
- Student DB

### Security
- Role-Based Access Control
- Session Management
- Data Encryption

## Data Flow
1. User Auth → API → Auth Service → User DB
2. Attendance → API → Attendance Service → Attendance DB
3. Reports → API → Report Service → Multiple DBs

## Deployment
- Load Balancer
- Web Servers (2x)
- Application Server
- Database Server
- Backup System 