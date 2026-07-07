# EuroWeekender (euroweekender.com) 🛫

A .NET microservices application that aggregates European weekend flight deals from Kiwi.com, helping travelers find spontaneous getaways across Europe.

[![.NET](https://img.shields.io/badge/.NET-8.0-blue.svg)](https://dotnet.microsoft.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/yourusername/weekend-flights/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/weekend-flights/actions)

## 📖 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### Core Functionality
- **Flight Aggregation**: Fetches weekend flight deals from multiple data sources (Kiwi.com, Tequila API)
- **Smart Filtering**: Filters flights by price range, duration, and quality metrics
- **City & Airport Database**: Maintains a comprehensive database of cities and airports with metadata
- **Import Pipeline**: Automated import pipeline for fresh flight data

### Developer Experience
- **Clean Architecture**: Following DDD principles with clear separation of concerns
- **Microservices Ready**: Modular design that can be scaled independently
- **Docker Support**: Containerized deployment with multi-platform support
- **Comprehensive Documentation**: Inline XML docs, architecture diagrams, and API documentation

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Worker        │────>│  Application     │────>│    API          │
│   (Worker)      │     │   Services       │     │   Controller    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │  Infrastructure │
                                     │  (Persistence)   │
                                     └─────────────────┘
```

### Layer Descriptions

| Layer | Responsibility | Key Components |
|-------|---------------|----------------|
| **Domain** | Business entities and domain logic | `City`, `Flight`, `Airport` entities |
| **Application** | Use cases, services, interfaces | Repository interfaces, API clients |
| **Infrastructure** | Data access, external APIs | EF Core DbContext, API clients |
| **API** | HTTP endpoints, DTOs | Controllers, Endpoints |

---

## 🛠️ Tech Stack

### Backend
- **.NET 8.0** - Latest LTS version with improved performance
- **ASP.NET Core Web API** - High-performance web framework
- **Entity Framework Core** - ORM for database operations
- **Clean Architecture** - SOLID principles and DDD patterns

### Infrastructure
- **Docker** - Containerization for consistent deployments
- **GitHub Actions** - CI/CD pipeline with automated testing
- **MySQL/PostgreSQL** - Relational database (configurable)

---

## 🚀 Getting Started

### Prerequisites
```bash
# Required tools
dotnet SDK 8.0+
Docker Desktop (optional, for containerized development)
Git
```

### Installation

#### Option 1: Clone and Restore
```bash
git clone https://github.com/yourusername/weekend-flights.git
cd weekend-flights

# Restore dependencies
dotnet restore

# Build the solution
dotnet build --configuration Release
```

#### Option 2: Docker (Recommended for Production)
```bash
# Build and run with Docker
docker-compose up -d

# Access API at http://localhost:5000
```

### Configuration

Create `appsettings.json` in the root or use environment variables:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=weekend_flights;Trusted_Connection=True;"
  },
  "KiwiApi": {
    "BaseUrl": "https://api.kiwi.com",
    "ApiKey": ""
  }
}
```

---

## 📡 API Documentation

### Base URL
`http://localhost:5000/api/v1` (configurable)

### Endpoints

#### Cities
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/cities/{id}` | Get city by ID |
| `GET`  | `/cities` | List all cities with pagination |

#### Flights
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/flights` | Search flights with filters |
| `GET`  | `/flights/{id}` | Get flight details by ID |

### Flight Search Parameters

```json
{
  "from": "LHR",      // Origin city code (optional)
  "to": "NYC",        // Destination city code (optional)
  "departureDate": "2024-12-28",
  "returnDate": "2025-01-03",
  "maxPrice": 500,    // Maximum price in local currency
  "minQuality": 7.0   // Minimum quality score (0-10)
}
```

### Example Response

```json
{
  "data": [
    {
      "id": 12345,
      "flyFrom": "London",
      "flyTo": "New York",
      "departureDate": "2024-12-28T10:30:00Z",
      "returnDate": "2025-01-03T16:45:00Z",
      "price": 429.99,
      "quality": 8.5,
      "durationTotal": 72,
      "bookingToken": "ABC123XYZ"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 💻 Development

### Running the Application

#### Debug Mode (Visual Studio / Rider)
Use the `launchSettings.json` in each project folder. Set breakpoints and debug normally.

#### Command Line
```bash
# Run API project
cd WeekendFlights.Api
dotnet run --urls "http://localhost:5000"

# Run worker as background service
cd WeekendFlights.Worker
dotnet run
```

### Database Migrations

```bash
# Apply pending migrations
dotnet ef database update

# Create new migration
dotnet ef migrations add AddNewFeature --project WeekendFlights.Infrastructure
```

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting pull requests.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following the code style guidelines
4. **Run tests**: Ensure all tests pass
5. **Submit a pull request** with a clear description

### Code Style Guidelines

- Follow [C# Coding Conventions](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- Use XML documentation comments for public APIs
- Keep methods focused and single-responsibility
- Write meaningful commit messages

---

## 📚 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Weekend Flights Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **Kiwi.com** - Flight search API provider
- **Tequila API** - Additional flight data source
- **.NET Foundation** - For the amazing .NET ecosystem

---

<div align="center">
Made with ❤️ by the EuroWeekender team
</div>