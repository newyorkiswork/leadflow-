# LeadFlow AI - API Documentation

## Overview

The LeadFlow AI API provides comprehensive endpoints for real estate investor workflows, including property analysis, skip tracing, deal management, and AI-powered insights.

**Base URL**: `https://api.leadflow.ai/v1`

## Authentication

All API requests require authentication using JWT tokens.

### Getting an API Token

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "your-email@example.com",
    "organizationId": "org-id"
  }
}
```

### Using the Token

Include the token in the Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Properties API

### Search Properties

Search for properties using various criteria.

```bash
GET /properties/search?city=Atlanta&state=GA&propertyType=SINGLE_FAMILY
```

**Query Parameters:**
- `city` (string): City name
- `state` (string): State abbreviation
- `zipCode` (string): ZIP code
- `propertyType` (string): Property type (SINGLE_FAMILY, MULTI_FAMILY, etc.)
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `minEquity` (number): Minimum equity amount
- `distressed` (boolean): Filter for distressed properties
- `limit` (number): Results per page (default: 50)
- `offset` (number): Pagination offset

**Response:**
```json
{
  "properties": [
    {
      "id": "prop-123",
      "address": {
        "street": "123 Main Street",
        "city": "Atlanta",
        "state": "GA",
        "zipCode": "30309"
      },
      "propertyDetails": {
        "propertyType": "SINGLE_FAMILY",
        "bedrooms": 3,
        "bathrooms": 2,
        "squareFootage": 1850
      },
      "valuation": {
        "marketValue": 275000,
        "equity": 95000,
        "equityPercent": 34.5
      }
    }
  ],
  "totalCount": 150,
  "hasMore": true
}
```

### Get Property Details

Get detailed information about a specific property.

```bash
GET /properties/{propertyId}
```

**Response:**
```json
{
  "id": "prop-123",
  "address": {
    "street": "123 Main Street",
    "city": "Atlanta",
    "state": "GA",
    "zipCode": "30309",
    "county": "Fulton"
  },
  "propertyDetails": {
    "propertyType": "SINGLE_FAMILY",
    "bedrooms": 3,
    "bathrooms": 2,
    "squareFootage": 1850,
    "lotSize": 0.25,
    "yearBuilt": 1995
  },
  "valuation": {
    "marketValue": 275000,
    "taxAssessedValue": 250000,
    "equity": 95000,
    "equityPercent": 34.5,
    "arv": 320000
  },
  "ownership": {
    "ownerName": "John Smith",
    "ownerType": "INDIVIDUAL",
    "ownerOccupied": false
  },
  "distress": {
    "isDistressed": false,
    "preForeclosure": false,
    "foreclosure": false
  }
}
```

### Analyze Property

Get AI-powered investment analysis for a property.

```bash
POST /properties/{propertyId}/analyze
Content-Type: application/json

{
  "strategy": "FIX_AND_FLIP",
  "purchasePrice": 275000,
  "repairCosts": 25000,
  "arv": 320000
}
```

**Response:**
```json
{
  "propertyId": "prop-123",
  "analysis": {
    "investmentScore": 85,
    "confidence": 0.87,
    "recommendation": "buy",
    "reasoning": [
      "High equity property with motivated seller",
      "Strong ARV potential in appreciating market",
      "Conservative repair estimates"
    ]
  },
  "profitability": {
    "grossProfit": 45000,
    "netProfit": 32000,
    "roi": 23.5,
    "cashOnCash": 18.2
  },
  "risks": [
    {
      "factor": "Market Volatility",
      "severity": "medium",
      "mitigation": "Conservative ARV estimates"
    }
  ]
}
```

## Skip Tracing API

### Skip Trace Property Owner

Find contact information for property owners.

```bash
POST /skip-trace/property-owner
Content-Type: application/json

{
  "propertyId": "prop-123",
  "ownerName": "John Smith",
  "address": "123 Main Street, Atlanta, GA 30309"
}
```

**Response:**
```json
{
  "id": "trace-456",
  "status": "completed",
  "confidence": 0.92,
  "person": {
    "firstName": "John",
    "lastName": "Smith",
    "age": 45
  },
  "contact": {
    "phones": [
      {
        "number": "+1-404-555-0123",
        "type": "mobile",
        "isValid": true,
        "confidence": 0.95
      }
    ],
    "emails": [
      {
        "address": "john.smith@email.com",
        "type": "personal",
        "isValid": true,
        "confidence": 0.88
      }
    ]
  },
  "addresses": [
    {
      "street": "456 Current Address",
      "city": "Atlanta",
      "state": "GA",
      "type": "current",
      "confidence": 0.90
    }
  ]
}
```

### Batch Skip Trace

Submit multiple records for skip tracing.

```bash
POST /skip-trace/batch
Content-Type: application/json

{
  "records": [
    {
      "firstName": "John",
      "lastName": "Smith",
      "address": "123 Main Street, Atlanta, GA"
    },
    {
      "firstName": "Jane",
      "lastName": "Doe",
      "address": "456 Oak Avenue, Birmingham, AL"
    }
  ]
}
```

**Response:**
```json
{
  "jobId": "batch-789",
  "status": "processing",
  "totalRecords": 2,
  "estimatedCost": 4.00,
  "estimatedCompletion": "2025-01-15T10:30:00Z"
}
```

## Leads API

### Create Lead

Create a new real estate lead.

```bash
POST /leads
Content-Type: application/json

{
  "firstName": "Michael",
  "lastName": "Johnson",
  "email": "mjohnson@email.com",
  "phone": "+1-404-555-0123",
  "leadType": "SELLER",
  "propertyId": "prop-123",
  "motivationLevel": "HIGH",
  "timeframe": "WITHIN_90_DAYS",
  "sellingReason": "RELOCATION"
}
```

**Response:**
```json
{
  "id": "lead-101",
  "firstName": "Michael",
  "lastName": "Johnson",
  "email": "mjohnson@email.com",
  "phone": "+1-404-555-0123",
  "leadType": "SELLER",
  "status": "NEW",
  "score": 75,
  "dealProbability": 0.68,
  "createdAt": "2025-01-15T09:00:00Z"
}
```

### Score Lead

Get AI-powered lead scoring.

```bash
POST /leads/{leadId}/score
```

**Response:**
```json
{
  "leadId": "lead-101",
  "score": 85,
  "factors": {
    "motivation": {
      "score": 90,
      "indicators": ["relocation", "timeline-pressure"],
      "urgency": "high"
    },
    "property": {
      "score": 80,
      "equity": 95000,
      "condition": "fair",
      "marketability": 85
    }
  },
  "recommendations": [
    "Contact within 24 hours",
    "Prepare cash offer",
    "Emphasize quick closing"
  ]
}
```

## Deals API

### Create Deal

Create a new investment deal.

```bash
POST /deals
Content-Type: application/json

{
  "dealName": "Atlanta Fix & Flip - Main Street",
  "dealType": "FIX_AND_FLIP",
  "strategy": "HARD_MONEY",
  "propertyId": "prop-123",
  "leadId": "lead-101",
  "purchasePrice": 275000,
  "repairCosts": 25000,
  "arv": 320000
}
```

**Response:**
```json
{
  "id": "deal-202",
  "dealName": "Atlanta Fix & Flip - Main Street",
  "dealType": "FIX_AND_FLIP",
  "status": "ANALYZING",
  "profitability": {
    "grossProfit": 45000,
    "netProfit": 32000,
    "roi": 23.5
  },
  "createdAt": "2025-01-15T09:00:00Z"
}
```

## AI Insights API

### Get Insights

Retrieve AI-generated insights for your organization.

```bash
GET /ai/insights?type=LEAD_SCORING&priority=HIGH
```

**Response:**
```json
{
  "insights": [
    {
      "id": "insight-301",
      "type": "LEAD_SCORING",
      "title": "High-Value Seller Lead Identified",
      "description": "Michael Johnson shows strong selling motivation with high equity property.",
      "confidence": 0.87,
      "priority": "HIGH",
      "recommendations": [
        "Contact within 24 hours",
        "Prepare competitive cash offer"
      ],
      "leadId": "lead-101",
      "createdAt": "2025-01-15T09:00:00Z"
    }
  ]
}
```

## Market Data API

### Get Market Trends

Get market analysis for a specific area.

```bash
GET /market/trends?city=Atlanta&state=GA&timeframe=12m
```

**Response:**
```json
{
  "area": {
    "city": "Atlanta",
    "state": "GA",
    "county": "Fulton"
  },
  "trends": {
    "priceDirection": "rising",
    "velocityChange": 15,
    "inventoryLevel": "low"
  },
  "investment": {
    "hotness": 85,
    "competition": "high",
    "avgROI": 18.5,
    "bestStrategies": ["FIX_AND_FLIP", "BUY_AND_HOLD"]
  },
  "forecast": {
    "nextQuarter": {
      "priceChange": 3.2,
      "confidence": 0.78
    }
  }
}
```

## Error Handling

The API uses standard HTTP status codes and returns error details in JSON format.

**Error Response Format:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid property type specified",
  "details": {
    "field": "propertyType",
    "code": "INVALID_VALUE"
  }
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited based on your subscription tier:

- **Starter**: 100 requests/hour
- **Professional**: 1,000 requests/hour
- **Enterprise**: 10,000 requests/hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642694400
```

## SDKs and Libraries

Official SDKs are available for:
- [JavaScript/Node.js](https://github.com/leadflow-ai/sdk-js)
- [Python](https://github.com/leadflow-ai/sdk-python)
- [PHP](https://github.com/leadflow-ai/sdk-php)

## Support

For API support:
- [API Documentation](https://docs.leadflow.ai/api)
- [GitHub Issues](https://github.com/leadflow-ai/platform/issues)
- [Developer Discord](https://discord.gg/leadflow-ai-dev)
